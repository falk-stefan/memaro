import { z } from 'zod';
import { LinkMemoriesSchema, RelatedMemorySchema } from '../tools/tools.schema.js';

export type MemoryRelation = {
  sourceId: string;
  targetId: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RelatedMemory = z.infer<typeof RelatedMemorySchema>;

export type CreateMemoryRelation = z.infer<typeof LinkMemoriesSchema>;

export type UpdateMemoryRelation = {
  type: string;
};
