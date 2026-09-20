import { ApiError } from '../error.js';
import { loadMemaroConfig } from '../tools/tools.config.js';
import { TagEntity } from '../db/table/tag.entity.js';

const memaroConfig = await loadMemaroConfig();

export const verifyTypeElseThrow = (value: string) => {
  const memoryTypes = Object.keys(memaroConfig.resources.memory.types);
  if (!memoryTypes.includes(value)) {
    throw new ApiError(
      400,
      `Invalid memory type: ${value}. Allowed types: ${memoryTypes.join(', ')}`,
    );
  }
};
