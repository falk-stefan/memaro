import {CreateMemory, Memory, MemoryQuery, UpdateMemory} from "../dto/memory.dto.js";
import {embed} from "./embedding.service.js";
import {qdrantClient} from "../qdrant.js";
import {MemoryEntity} from "../db/table/memory.entity.js";
import {ApiError, NotFoundError} from "../error.js";
import {removeUndefinedAndValidate, UpdateValues} from "./dto.util.js";
import {MemoryRelationEntity} from "../db/table/memory-relation.entity.js";
import {withTransaction} from "../db/db.util.js";
import {toMemory, toMemorySearchResult} from "../dto/mapper/memory.mapper.js";
import {loadMemaroConfig} from "../tools/tools.config.js";

const memaroConfig = await loadMemaroConfig();
const verifyTypeElseThrow = (value: string) => {
  const memoryTypes = Object.keys(memaroConfig.resources.memory.types);
  if (!memoryTypes.includes(value)) {
    throw new ApiError(400, `Invalid memory type: ${value}. Allowed types: ${memoryTypes.join(', ')}`);
  }
}

export const createMemory = async (create: CreateMemory): Promise<Memory> => {

  verifyTypeElseThrow(create.type);

  const embedding = await embed(create.text);

  const memoryEntity = await withTransaction(async (options) => {
    const created = await MemoryEntity.create(create, options);
    await upsertMemory({memoryEntity: created, embedding, payload: create});
    return created;
  });

  return toMemory(memoryEntity);
}


export const getMemory = async (id: string): Promise<Memory> => {
  const memoryEntity = await MemoryEntity.findOne({where: {id}});
  if (!memoryEntity) {
    throw new NotFoundError('memory');
  }
  return toMemory(memoryEntity);
}


export const getMemories = async (query: MemoryQuery) => {
  const {text, type, limit = 10} = query;

  const embedding = await embed(text);

  const must = type ? [{key: 'type', match: {value: type}}] : [];

  const qdrandResult = await qdrantClient.search('memory', {
    vector: embedding,
    filter: {must: must,},
    limit: limit,
    with_payload: true
  });

  const ids = qdrandResult.map(r => r.id);
  const memories = await MemoryEntity.findAll({
    attributes: ['id', 'text', 'type'],
    include: [{
      model: MemoryRelationEntity,
      attributes: ['sourceId', 'targetId', 'type'],
      include: [{
        model: MemoryEntity,
        attributes: ['id', 'text', 'type'],
        as: 'target'
      }],
      limit: 10
    }],
    where: {id: ids}
  });

  return toMemorySearchResult(memories, qdrandResult);
}


export const updateMemory = async ({id, values}: UpdateValues<UpdateMemory>) => {
  const sanitized = removeUndefinedAndValidate(values)

  const memoryEntity = await MemoryEntity.findOne({where: {id}});
  if (!memoryEntity) {
    throw new NotFoundError('memory');
  }

  if (sanitized.text) {
    const embedding = await embed(sanitized.text);
    await upsertMemory({memoryEntity, embedding, payload: sanitized});
  }

  if (sanitized.type) {
    verifyTypeElseThrow(sanitized.type);
  }

  await memoryEntity.update(sanitized);
}


export const deleteMemory = async (id: string) => {
  const memoryEntity = await MemoryEntity.findOne({where: {id}});
  if (!memoryEntity) {
    throw new NotFoundError('memory');
  }

  await qdrantClient.delete('memory', {
    wait: true,
    filter: {must: [{key: 'id', match: {value: Number(id)}}]},
  });

  await memoryEntity.destroy();
}

const upsertMemory = async (
  params: {
    memoryEntity: MemoryEntity,
    embedding: number [],
    payload: CreateMemory | UpdateMemory
  }
) => {
  try {
    await qdrantClient.upsert('memory', {
      wait: true,
      points: [
        {
          id: Number(params.memoryEntity.id),
          vector: params.embedding,
          payload: params.payload,
        }
      ]
    });
  } catch (e) {
    console.error("Error while updating memory", JSON.stringify(e, null, 2));
    throw e
  }
}
