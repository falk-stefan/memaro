import {CreateTag, TagQuery} from "../dto/tag.dto.js";
import {TagEntity} from "../db/table/tag.entity.js";
import {qdrantClient} from "../qdrant.js";
import {withTransaction} from "../db/db.util.js";
import {toTag} from "../dto/mapper/tag.mapper.js";
import {embed} from "./embedding.service.js";


export const createTag = async (create: CreateTag) => {
  const embedding = await embed(create.description);

  const tagEntity = await withTransaction(async (options) => {
    const created = await TagEntity.create(create, options);
    await upsertTag({tagEntity: created, embedding, payload: create});
    return created;
  })
  return toTag(tagEntity);
}

export const getTags = async (query: TagQuery) => {
  const {text, limit = 10} = query;

  const embedding = await embed(text);

  const qdrandResult = await qdrantClient.search('tag', {
    vector: embedding,
    limit: limit,
    with_payload: true
  });

  const ids = qdrandResult.map(r => r.id);

  const tags = await TagEntity.findAll({where: {id: ids}});

  return tags.map(toTag);
}

const upsertTag = async (
  params: {
    tagEntity: TagEntity,
    embedding: number [],
    payload: CreateTag
  }
) => {
  try {
    await qdrantClient.upsert('tag', {
      wait: true,
      points: [
        {
          id: Number(params.tagEntity.id),
          vector: params.embedding,
          payload: params.payload,
        }
      ]
    });
  } catch (e) {
    console.error("Error while updating tag", JSON.stringify(e, null, 2));
    throw e
  }
}