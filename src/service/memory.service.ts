import { CreateMemory, Memory, MemoryQuery, UpdateMemory } from '../dto/memory.dto.js';
import { embedDocument, embedQuery } from './embedding.service.js';
import { qdrantClient } from '../db/qdrant.js';
import { MemoryEntity } from '../db/table/memory.entity.js';
import { NotFoundError } from '../error.js';
import { removeUndefinedAndValidate, UpdateValues } from './dto.util.js';
import { MemoryRelationEntity } from '../db/table/memory-relation.entity.js';
import { withTransaction } from '../db/db.util.js';
import { toMemory, toMemorySearchResult } from '../dto/mapper/memory.mapper.js';
import { verifyTypeElseThrow } from '../validation/verify.js';
import { findTagsElseThrow } from './tag.service.js';
import { MemoriesView } from '../db/view/memory.view.js';
import type { Identity } from '../auth.js';

export class MemoryService {
  static async createMemory(create: CreateMemory, identity: Identity): Promise<Memory> {
    verifyTypeElseThrow(create.type);

    const tags = await findTagsElseThrow(create.tags, identity);

    const embedding = await embedDocument(create.text);

    const memoryEntity = await withTransaction(async (options) => {
      const created = await MemoryEntity.create(
        { ...create, orgId: identity.orgId, userId: identity.userId },
        options,
      );
      await created.$set('tags', tags, options);

      await upsertMemory({
        memoryEntity: created,
        embedding,
        payload: { ...create, orgId: identity.orgId, userId: identity.userId },
      });

      return created;
    });

    return toMemory(memoryEntity);
  }

  // `identity` isn't used for scoping/filtering yet (#8 is plumbing only —
  // that's Milestone 3/#6) but every call site now has it available.
  static async updateMemory({ id, values }: UpdateValues<UpdateMemory>, identity: Identity) {
    const sanitized = removeUndefinedAndValidate(values);

    const memoryEntity = await MemoryEntity.findOne({ where: { id } });
    if (!memoryEntity) {
      throw new NotFoundError('memory');
    }

    if (sanitized.text) {
      const embedding = await embedDocument(sanitized.text);
      await upsertMemory({ memoryEntity, embedding, payload: sanitized });
    }

    if (sanitized.type) {
      verifyTypeElseThrow(sanitized.type);
    }

    await memoryEntity.update(sanitized);
  }

  static async getMemory(id: string, identity: Identity): Promise<Memory> {
    const memoryEntity = await MemoryEntity.findOne({ where: { id } });
    if (!memoryEntity) {
      throw new NotFoundError('memory');
    }
    return toMemory(memoryEntity);
  }

  static async getMemories(query: MemoryQuery, identity: Identity) {
    const { text, type, limit = 10 } = query;

    const embedding = await embedQuery(text);

    const must = type ? [{ key: 'type', match: { value: type } }] : [];

    const qdrantResult = await qdrantClient.search('memory', {
      vector: embedding,
      filter: { must: must },
      limit: limit,
      with_payload: true,
    });

    const ids = qdrantResult.map((r) => r.id);
    const memories = await MemoryEntity.findAll(MemoriesView({ ids }));

    return toMemorySearchResult(memories, qdrantResult);
  }

  static async deleteMemory(id: string, identity: Identity) {
    const memoryEntity = await MemoryEntity.findOne({ where: { id } });
    if (!memoryEntity) {
      throw new NotFoundError('memory');
    }

    await qdrantClient.delete('memory', {
      wait: true,
      filter: { must: [{ key: 'id', match: { value: Number(id) } }] },
    });

    await memoryEntity.destroy();
  }
}

const upsertMemory = async (params: {
  memoryEntity: MemoryEntity;
  embedding: number[];
  payload: (CreateMemory & { orgId: string; userId: string }) | UpdateMemory;
}) => {
  try {
    await qdrantClient.upsert('memory', {
      wait: true,
      points: [
        {
          id: Number(params.memoryEntity.id),
          vector: params.embedding,
          payload: params.payload,
        },
      ],
    });
  } catch (e) {
    console.error('Error while updating memory', JSON.stringify(e, null, 2));
    throw e;
  }
};
