import z from "zod";

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
});

const MemoryTypeSchema = z.object({
  description: z.string(),
})

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
