import { Op } from 'sequelize';
import { qdrantClient } from '../db/qdrant.js';
import { InstructionDocEntity } from '../db/table/instruction-doc.entity.js';
import { embedQuery } from './embedding.service.js';
import { sparseVector } from '../ingestion/sparse.js';
import { TOTAL_RESPONSE_TOKEN_CAP } from '../ingestion/limits.js';
import { ApiError, NotFoundError } from '../error.js';
import {
  GetInstructionQuery,
  InstructionChunkResult,
  InstructionDocFull,
  InstructionDocSummary,
  ReadInstructionsQuery,
  ReadInstructionsResult,
} from '../dto/instruction.dto.js';

// RRF has one tunable, k — higher values flatten the influence of rank
// position; 60 is the commonly-cited default from the original paper and
// has no corpus-specific tuning behind it here.
const RRF_K = 60;
const CANDIDATE_LIMIT = 20;
const TOTAL_RESPONSE_CHAR_CAP = TOTAL_RESPONSE_TOKEN_CAP * 4;

// Dense search alone always returns its top-K nearest points, however
// unrelated the query — there's no natural "nothing matched" from cosine
// similarity without a floor. Without this, a query about something the
// corpus has nothing to do with still comes back "found" with whatever
// happened to be least-dissimilar. 0.45 is an empirical starting point
// (nomic-embed-text-v1.5, query-vs-document mode): observed genuine matches
// scored 0.53-0.82, observed unrelated queries topped out at ~0.41 against
// a small real test corpus — worth revisiting once real usage data exists.
const DENSE_SCORE_THRESHOLD = 0.45;

type InstructionChunkPayload = {
  docId: number;
  headingPath: string[];
  text: string;
  title: string;
  sourceUrl: string;
};

type ScoredPoint = {
  id: string | number;
  payload?: Record<string, unknown> | null;
};

const toDocSummary = (doc: InstructionDocEntity): InstructionDocSummary => ({
  docId: Number(doc.id),
  title: doc.title,
  contextTags: doc.contextTags,
  owner: doc.owner,
  scope: doc.scope,
  sourceUrl: doc.sourceUrl,
});

const toDocFull = (doc: InstructionDocEntity): InstructionDocFull => ({
  ...toDocSummary(doc),
  body: doc.body,
  lastReviewed: doc.lastReviewed ? new Date(doc.lastReviewed).toISOString().slice(0, 10) : null,
});

// Reciprocal rank fusion: a point's fused score is the sum, across every
// ranking it appears in, of 1/(k + rank). This combines the dense and
// sparse result lists without needing their raw scores to be on a
// comparable scale, which cosine similarity and a hashed term-frequency
// score are not.
const fuseRankings = (rankings: ScoredPoint[][]): ScoredPoint[] => {
  const scores = new Map<string, number>();
  const byId = new Map<string, ScoredPoint>();

  for (const ranking of rankings) {
    ranking.forEach((point, rank) => {
      const key = String(point.id);
      byId.set(key, point);
      scores.set(key, (scores.get(key) ?? 0) + 1 / (RRF_K + rank + 1));
    });
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => byId.get(key)!);
};

// `Model.findAll({ where: { id: [...] } })` returns rows in table order, not
// the order of the id array — a fused rank is meaningless unless something
// re-sorts the query result back into it explicitly.
export const reorderByFusedRank = <T>(
  items: T[],
  orderedIds: number[],
  getId: (item: T) => number,
): T[] => {
  const byId = new Map(items.map((item) => [getId(item), item]));
  return orderedIds.map((id) => byId.get(id)).filter((item): item is T => item !== undefined);
};

const fetchDocsInOrder = async (orderedDocIds: number[]): Promise<InstructionDocEntity[]> => {
  const docs = await InstructionDocEntity.findAll({ where: { id: orderedDocIds } });
  return reorderByFusedRank(docs, orderedDocIds, (doc) => Number(doc.id));
};

type PackResult<T> = { items: T[]; truncated: boolean };

const packChunks = (points: ScoredPoint[]): PackResult<InstructionChunkResult> => {
  const chunks: InstructionChunkResult[] = [];
  let usedChars = 0;

  for (const point of points) {
    const payload = point.payload as unknown as InstructionChunkPayload;

    if (usedChars + payload.text.length > TOTAL_RESPONSE_CHAR_CAP && chunks.length > 0) {
      return { items: chunks, truncated: true };
    }

    chunks.push({
      docId: payload.docId,
      title: payload.title,
      headingPath: payload.headingPath,
      text: payload.text,
      sourceUrl: payload.sourceUrl,
    });
    usedChars += payload.text.length;
  }

  return { items: chunks, truncated: false };
};

const packBodies = (docs: InstructionDocEntity[]): PackResult<InstructionChunkResult> => {
  const chunks: InstructionChunkResult[] = [];
  let usedChars = 0;

  for (const doc of docs) {
    if (usedChars + doc.body.length > TOTAL_RESPONSE_CHAR_CAP && chunks.length > 0) {
      return { items: chunks, truncated: true };
    }
    chunks.push({
      docId: Number(doc.id),
      title: doc.title,
      headingPath: [],
      text: doc.body,
      sourceUrl: doc.sourceUrl,
    });
    usedChars += doc.body.length;
  }

  return { items: chunks, truncated: false };
};

// The shared "full didn't fit" fallback: rather than a silently partial
// chunk/body list, return every matching doc's summary (uncapped by
// `limit`, which only bounds how much *full* content we attempt) plus a
// message pointing at getInstruction for full content on a specific one.
const truncatedShortResult = (
  allDocs: InstructionDocEntity[],
  matchCountLabel: string,
): ReadInstructionsResult => ({
  found: true,
  docs: allDocs.map(toDocSummary),
  truncated: true,
  message:
    `${allDocs.length} documents matched ${matchCountLabel} but full content exceeds the ` +
    `response budget — showing summaries instead. Call get_instruction({ docId }) for a ` +
    `specific one's full content.`,
});

export class InstructionService {
  static async readInstructions(query: ReadInstructionsQuery): Promise<ReadInstructionsResult> {
    const { context, tags, mode = 'full', limit = 10 } = query;

    if (!context && !tags?.length) {
      throw new ApiError(400, 'Provide at least one of `context` or `tags`.');
    }

    if (!context) {
      return InstructionService.readByTagsOnly(tags!, mode, limit);
    }

    const filter = tags?.length
      ? { must: [{ key: 'contextTags', match: { any: tags } }] }
      : undefined;

    const candidateLimit = Math.max(limit, CANDIDATE_LIMIT);

    const [denseResults, sparseResults] = await Promise.all([
      qdrantClient.search('instruction', {
        vector: { name: 'dense', vector: await embedQuery(context) },
        filter,
        limit: candidateLimit,
        score_threshold: DENSE_SCORE_THRESHOLD,
        with_payload: true,
      }),
      qdrantClient.search('instruction', {
        vector: { name: 'sparse', vector: sparseVector(context) },
        filter,
        limit: candidateLimit,
        with_payload: true,
      }),
    ]);

    const fused = fuseRankings([denseResults, sparseResults]);

    if (fused.length === 0) {
      return {
        found: false,
        message: 'No instructions found for this context — proceed with judgment.',
      };
    }

    const orderedDocIds = [
      ...new Set(fused.map((point) => (point.payload as unknown as InstructionChunkPayload).docId)),
    ];

    if (mode === 'short') {
      const docs = await fetchDocsInOrder(orderedDocIds.slice(0, limit));
      return { found: true, docs: docs.map(toDocSummary) };
    }

    const { items, truncated } = packChunks(fused.slice(0, limit));
    if (!truncated && orderedDocIds.length <= limit) {
      return { found: true, chunks: items };
    }

    const allDocs = await fetchDocsInOrder(orderedDocIds);
    return truncatedShortResult(allDocs, 'this context');
  }

  private static async readByTagsOnly(
    tags: string[],
    mode: 'full' | 'short',
    limit: number,
  ): Promise<ReadInstructionsResult> {
    // Unlimited: with no relevance ranking to cut against, we need to know
    // the true match count to decide whether `full` fits or must fall back
    // (see truncatedShortResult) — a DB-level limit here would silently
    // hide matches before that decision could even be made.
    const allDocs = await InstructionDocEntity.findAll({
      where: { contextTags: { [Op.overlap]: tags } },
      order: [['title', 'ASC']],
    });

    if (allDocs.length === 0) {
      return {
        found: false,
        message: 'No instructions found for these tags — proceed with judgment.',
      };
    }

    if (mode === 'short') {
      return { found: true, docs: allDocs.slice(0, limit).map(toDocSummary) };
    }

    const { items, truncated } = packBodies(allDocs.slice(0, limit));
    if (!truncated && allDocs.length <= limit) {
      return { found: true, chunks: items };
    }

    return truncatedShortResult(allDocs, `tags [${tags.join(', ')}]`);
  }

  static async getInstruction(query: GetInstructionQuery): Promise<InstructionDocFull> {
    const doc = await InstructionDocEntity.findByPk(query.docId);
    if (!doc) {
      throw new NotFoundError(`instruction doc: ${query.docId}`);
    }
    return toDocFull(doc);
  }
}
