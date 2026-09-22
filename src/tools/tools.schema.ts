import { z } from 'zod';
import { loadMemaroConfig } from './tools.config.js';

const memaroConfig = await loadMemaroConfig();
const MemoryTypeList = memaroConfig.resources.memory.types;
const MemoryRelationTypeList = memaroConfig.resources.memory.relations;

/**
 * Common enums
 */
const MemoryTypeListSchema = z.enum(Object.keys(MemoryTypeList));
const MemoryRelationTypeListSchema = z.enum(MemoryRelationTypeList);

/**
 * Model for a related memory.
 * @property targetId The ID of the related memory.
 * @property type The relation type e.g. "explains" or "explainedBy".
 */
export const RelatedMemorySchema = z.object({
  targetId: z.string().nonempty(),
  type: MemoryRelationTypeListSchema.nonoptional(),
});

/**
 * Add Memory
 */
export const CreateMemorySchema = z.object({
  text: z.string().min(1).max(320),
  type: MemoryTypeListSchema.nonoptional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
});

/**
 * Get Memory
 */
export const GetMemorySchema = z.object({
  id: z.string().nonempty(),
});

/**
 * Get Memories
 */
export const GetMemoriesSchema = z.object({
  text: z.string().min(1).nonempty(),
  type: MemoryTypeListSchema.optional(),
  limit: z.number().int().max(10).positive().optional(),
});

/**
 * Update Memory
 */
export const UpdateMemorySchema = z.object({
  id: z.string().nonempty(),
  values: z.object({
    text: z.string().min(1).max(320).optional(),
    type: z.string().min(1).optional(),
    tags: z.array(z.string()).min(1).max(10).optional(),
  }),
});

/**
 * Remove Memory
 */
export const DeleteMemorySchema = z.object({
  id: z.string().nonempty(),
});

/**
 * Link Memories
 */
export const LinkMemoriesSchema = z.object({
  sourceId: z.string().nonempty(),
  targetId: z.string().nonempty(),
  type: z.string().nonempty(),
});

/**
 * Add Tag
 */
export const CreateTagSchema = z.object({
  name: z
    .stringFormat('[a-z]+', /^[a-z]+$/)
    .min(1)
    .max(32),
  description: z.string().min(1).max(320),
});

/**
 * Get Tags
 */
export const GetTagsSchema = z.object({
  text: z.string().min(1).nonempty(),
  limit: z.number().int().max(10).positive().optional(),
});

/**
 * Read Instructions
 *
 * At least one of `context`/`tags` must be given — enforced in
 * InstructionService rather than here, since a .refine() would turn this
 * into a ZodEffects and break the plain-ZodObject shape the rest of the
 * tool registration pipeline (stripSchema, the Tool<T> generic) assumes.
 */
export const ReadInstructionsSchema = z.object({
  context: z.string().min(1).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  mode: z.enum(['full', 'short']).optional(),
  limit: z.number().int().max(10).positive().optional(),
});

/**
 * Get Instruction
 *
 * Fetches one instruction doc's full body by id — the counterpart to
 * `read_instructions`'s `mode: "short"` results, which name a `docId` but
 * (before this) had nothing that accepted it.
 */
export const GetInstructionSchema = z.object({
  docId: z.number().int().positive(),
});
