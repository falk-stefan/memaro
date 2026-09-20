import { Op } from 'sequelize';
import { qdrantClient } from '../db/qdrant.js';
import { InstructionDocEntity } from '../db/table/instruction-doc.entity.js';
import { embedQuery } from './embedding.service.js';
import { sparseVector } from '../ingestion/sparse.js';
import { TOTAL_RESPONSE_TOKEN_CAP } from '../ingestion/limits.js';
import { ApiError } from '../error.js';
import {
  InstructionChunkResult,
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

const packChunks = (points: ScoredPoint[]): InstructionChunkResult[] => {
  const chunks: InstructionChunkResult[] = [];
  let usedChars = 0;

  for (const point of points) {
    const payload = point.payload as unknown as InstructionChunkPayload;

    if (usedChars + payload.text.length > TOTAL_RESPONSE_CHAR_CAP && chunks.length > 0) {
      break;
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

  return chunks;
};

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

    const fused = fuseRankings([denseResults, sparseResults]).slice(0, limit);

    if (fused.length === 0) {
      return {
        found: false,
        message: 'No instructions found for this context — proceed with judgment.',
      };
    }

    if (mode === 'short') {
      const docs = await InstructionDocEntity.findAll({
        where: {
          id: [
            ...new Set(
              fused.map((point) => (point.payload as unknown as InstructionChunkPayload).docId),
            ),
          ],
        },
      });
      return { found: true, docs: docs.map(toDocSummary) };
    }

    return { found: true, chunks: packChunks(fused) };
  }

  private static async readByTagsOnly(
    tags: string[],
    mode: 'full' | 'short',
    limit: number,
  ): Promise<ReadInstructionsResult> {
    const docs = await InstructionDocEntity.findAll({
      where: { contextTags: { [Op.overlap]: tags } },
      order: [['title', 'ASC']],
      limit,
    });

    if (docs.length === 0) {
      return {
        found: false,
        message: 'No instructions found for these tags — proceed with judgment.',
      };
    }

    if (mode === 'short') {
      return { found: true, docs: docs.map(toDocSummary) };
    }

    const chunks: InstructionChunkResult[] = [];
    let usedChars = 0;

    for (const doc of docs) {
      if (usedChars + doc.body.length > TOTAL_RESPONSE_CHAR_CAP && chunks.length > 0) {
        break;
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

    return { found: true, chunks };
  }
}
