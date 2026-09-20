import {
  CreateMemorySchema,
  CreateTagSchema,
  GetMemoriesSchema,
  GetMemorySchema,
  GetTagsSchema,
  LinkMemoriesSchema,
  DeleteMemorySchema,
  ReadInstructionsSchema,
  UpdateMemorySchema,
} from './tools.schema.js';
import { ZodObject } from 'zod';
import { loadMemaroConfig } from './tools.config.js';
import { MemoryService } from '../service/memory.service.js';
import { MemoryRelationsService } from '../service/memory-relations.service.js';
import { TagService } from '../service/tag.service.js';
import { InstructionService } from '../service/instruction.service.js';

type Tool<T extends ZodObject<any>> = {
  name:
    | 'add_memory'
    | 'get_memory'
    | 'update_memory'
    | 'remove_memory'
    | 'search_memories'
    | 'link_memory'
    | 'add_tag'
    | 'search_tags'
    | 'read_instructions';
  description: string;
  inputSchema: T;
  handler: (input: never) => Promise<unknown>;
};

const config = await loadMemaroConfig();

const toolsConfig = config.tools;

const stripSchema = (obj: ZodObject<any>): Record<string, unknown> => {
  const { $schema, ...other } = obj.toJSONSchema();
  return other;
};

const typeExamplesDisplay = Object.entries(config.resources.memory.types)
  .map(([key, value]) => {
    return `\`${key}\`\n${value.description}`;
  })
  .join('');

export const TOOLS: Tool<ZodObject<any>>[] = [
  {
    name: 'add_memory',
    description: `${toolsConfig.add_memory.description}\n# Type Examples\n${typeExamplesDisplay}`,
    inputSchema: CreateMemorySchema,
    handler: MemoryService.createMemory,
  },
  {
    name: 'get_memory',
    description: toolsConfig.get_memory.description,
    inputSchema: GetMemorySchema,
    handler: MemoryService.getMemory,
  },
  {
    name: 'update_memory',
    description: toolsConfig.update_memory.description,
    inputSchema: UpdateMemorySchema,
    handler: MemoryService.updateMemory,
  },
  {
    name: 'search_memories',
    description: toolsConfig.search_memories.description,
    inputSchema: GetMemoriesSchema,
    handler: MemoryService.getMemories,
  },
  {
    name: 'remove_memory',
    description: toolsConfig.remove_memory.description,
    inputSchema: DeleteMemorySchema,
    handler: MemoryService.deleteMemory,
  },
  {
    name: 'link_memory',
    description: toolsConfig.link_memory.description,
    inputSchema: LinkMemoriesSchema,
    handler: MemoryRelationsService.createMemoryRelation,
  },
  {
    name: 'add_tag',
    description: toolsConfig.add_tag.description,
    inputSchema: CreateTagSchema,
    handler: TagService.createTag,
  },
  {
    name: 'search_tags',
    description: toolsConfig.search_tags.description,
    inputSchema: GetTagsSchema,
    handler: TagService.getTags,
  },
  {
    name: 'read_instructions',
    description: toolsConfig.read_instructions.description,
    inputSchema: ReadInstructionsSchema,
    handler: InstructionService.readInstructions,
  },
];

export class ToolService {
  static async getTools() {
    return TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: stripSchema(tool.inputSchema),
    }));
  }
}
