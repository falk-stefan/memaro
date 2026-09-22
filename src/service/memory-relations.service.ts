import { MemoryRelationEntity } from '../db/table/memory-relation.entity.js';
import { CreateMemoryRelation, type UpdateMemoryRelation } from '../dto/memory-relation.dto.js';
import { removeUndefinedAndValidate, UpdateValues } from './dto.util.js';
import { toMemoryRelation } from '../dto/mapper/memory.mapper.js';
import { loadMemaroConfig } from '../tools/tools.config.js';
import { ApiError, NotFoundError } from '../error.js';
import { resolveLegacyTenant } from '../db/legacy-tenant.js';

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
  static async createMemoryRelation(create: CreateMemoryRelation) {
    verifyRelationTypeElseThrow(create.type);

    // Stopgap tenant until #8 threads the caller's real identity through —
    // see src/db/legacy-tenant.ts.
    const tenant = await resolveLegacyTenant();

    const memoryRelationEntity = await MemoryRelationEntity.create({ ...create, ...tenant });

    return toMemoryRelation(memoryRelationEntity);
  }

  static async updateMemoryRelations({ id, values }: UpdateValues<UpdateMemoryRelation>) {
    const sanitized = removeUndefinedAndValidate(values);

    if (sanitized.type) {
      verifyRelationTypeElseThrow(sanitized.type);
    }

    await MemoryRelationEntity.update(sanitized, { where: { id } });
    return sanitized;
  }

  static async deleteMemoryRelations(id: string) {
    const memoryRelationEntity = await MemoryRelationEntity.findOne({ where: { id } });

    if (!memoryRelationEntity) {
      throw new NotFoundError('memory relation');
    }

    await memoryRelationEntity.destroy();
  }
}
