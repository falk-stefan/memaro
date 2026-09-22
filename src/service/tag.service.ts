import { CreateTag, TagQuery } from '../dto/tag.dto.js';
import { TagEntity } from '../db/table/tag.entity.js';
import { qdrantClient } from '../db/qdrant.js';
import { withTransaction } from '../db/db.util.js';
import { toTag } from '../dto/mapper/tag.mapper.js';
import { embedDocument, embedQuery } from './embedding.service.js';
import { ApiError } from '../error.js';
import type { Identity } from '../auth.js';

export class TagService {
  static async createTag(create: CreateTag, identity: Identity) {
    const embedding = await embedDocument(create.description);

    const tagEntity = await withTransaction(async (options) => {
      const created = await TagEntity.create({ ...create, orgId: identity.orgId }, options);
      await upsertTag({ tagEntity: created, embedding, payload: create });
      return created;
    });
    return toTag(tagEntity);
  }

  // `identity` isn't used for scoping/filtering yet (#8 is plumbing only —
  // that's Milestone 3/#6) but every call site now has it available.
  static async getTags(query: TagQuery, identity: Identity) {
    const { text, limit = 10 } = query;

    const embedding = await embedQuery(text);

    const qdrandResult = await qdrantClient.search('tag', {
      vector: embedding,
      limit: limit,
      with_payload: true,
    });

    const ids = qdrandResult.map((r) => r.id);

    const tags = await TagEntity.findAll({ where: { id: ids } });

    return tags.map(toTag);
  }
}

const upsertTag = async (params: {
  tagEntity: TagEntity;
  embedding: number[];
  payload: CreateTag;
}) => {
  try {
    await qdrantClient.upsert('tag', {
      wait: true,
      points: [
        {
          id: Number(params.tagEntity.id),
          vector: params.embedding,
          payload: params.payload,
        },
      ],
    });
  } catch (e) {
    console.error('Error while updating tag', JSON.stringify(e, null, 2));
    throw e;
  }
};

export const findTagsElseThrow = async (tags: string[] | undefined, identity: Identity) => {
  if (!tags || !tags.length) {
    return [];
  }

  const tagEntities = await TagEntity.findAll({ where: { name: tags } });

  if (tagEntities.length === tags.length) {
    return [];
  }

  const missing = [];

  for (const tagName of tags) {
    const exists = tagEntities.find((tag) => tag.name === tagName);
    if (!exists) {
      missing.push(tagName);
    }
  }

  if (missing.length > 0) {
    throw new ApiError(404, `Tags do not exist: ${missing.join(', ')}. Please create them first.`);
  }

  return tagEntities;
};
