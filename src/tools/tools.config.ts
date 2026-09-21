import * as fs from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';

const ToolConfigSchema = z.object({
  description: z.string(),
});

const ToolsSchema = z.object({
  add_memory: ToolConfigSchema,
  get_memory: ToolConfigSchema,
  update_memory: ToolConfigSchema,
  remove_memory: ToolConfigSchema,
  link_memory: ToolConfigSchema,
  search_memories: ToolConfigSchema,
  add_tag: ToolConfigSchema,
  search_tags: ToolConfigSchema,
  read_instructions: ToolConfigSchema,
  get_instruction: ToolConfigSchema,
});

const MemoryTypeSchema = z.object({
  description: z.string(),
});

const MemorySchema = z.object({
  types: z.record(z.string(), MemoryTypeSchema),
  relations: z.array(z.string()).readonly(),
});

const ResourcesSchema = z.object({
  memory: MemorySchema,
});

export const MemaroConfigSchema = z.object({
  tools: ToolsSchema,
  resources: ResourcesSchema,
});

let cached: z.infer<typeof MemaroConfigSchema>;

export const loadMemaroConfig = async () => {
  if (cached) {
    return cached;
  }

  const memaroConfig = process.env.MEMARO_CONFIG ?? './config.yaml';
  const file = fs.readFileSync(memaroConfig!, 'utf8');
  const rawConfig = parse(file);
  const { data: config, error } = MemaroConfigSchema.safeParse(rawConfig);

  if (!config) {
    throw error;
  }
  cached = Object.freeze(config);
  return cached;
};
