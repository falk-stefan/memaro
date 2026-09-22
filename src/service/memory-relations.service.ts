import { MemoryRelationEntity } from '../db/table/memory-relation.entity.js';
import { CreateMemoryRelation, type UpdateMemoryRelation } from '../dto/memory-relation.dto.js';
import { removeUndefinedAndValidate, UpdateValues } from './dto.util.js';
import { toMemoryRelation } from '../dto/mapper/memory.mapper.js';
import { loadMemaroConfig } from '../tools/tools.config.js';
import { ApiError, NotFoundError } from '../error.js';
import type { Identity } from '../auth.js';

const memaroConfig = await loadMemaroConfig();
const verifyRelationTypeElseThrow = (value: string) => {
  const relationTypes = memaroConfig.resources.memory.relations;
  if (!relationTypes.includes(value)) {
    throw new ApiError(
      400,
      `Invalid memory relation type: ${value}. Allowed types: ${relationTypes.join(', ')}`,
    );
  }
};

export class MemoryRelationsService {
  static async createMemoryRelation(create: CreateMemoryRelation, identity: Identity) {
    verifyRelationTypeElseThrow(create.type);

    const memoryRelationEntity = await MemoryRelationEntity.create({
      ...create,
      orgId: identity.orgId,
      userId: identity.userId,
    });

    return toMemoryRelation(memoryRelationEntity);
  }

  // `identity` isn't used for scoping/filtering yet (#8 is plumbing only —
  // that's Milestone 3/#6) but every call site now has it available.
  static async updateMemoryRelations(
    { id, values }: UpdateValues<UpdateMemoryRelation>,
    identity: Identity,
  ) {
    const sanitized = removeUndefinedAndValidate(values);

    if (sanitized.type) {
      verifyRelationTypeElseThrow(sanitized.type);
    }

    await MemoryRelationEntity.update(sanitized, { where: { id } });
    return sanitized;
  }

  static async deleteMemoryRelations(id: string, identity: Identity) {
    const memoryRelationEntity = await MemoryRelationEntity.findOne({ where: { id } });

    if (!memoryRelationEntity) {
      throw new NotFoundError('memory relation');
    }

    await memoryRelationEntity.destroy();
  }
}
