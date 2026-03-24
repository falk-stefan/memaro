import {
    CreateMemorySchema,
    CreateTagSchema,
    GetMemoriesSchema,
    GetMemorySchema,
    GetTagsSchema,
    LinkMemoriesSchema,
    RemoveMemorySchema,
    UpdateMemorySchema
} from "./tools.schema.js";
import {ZodObject} from "zod";
import {createMemory, deleteMemory, getMemories, getMemory, updateMemory} from "../service/memory.service.js";
import {createMemoryRelation} from "../service/memory-relations.service.js";
import {loadMemaroConfig} from "./tools.config.js";
import {createTag, getTags} from "../service/tag.service.js";

type Tool<T extends ZodObject<any>> =
  {
      name: "add_memory" | "get_memory" | "update_memory" | "remove_memory" | "search_memories" | "link_memory" | "add_tag" | "search_tags";
      description: string;
      inputSchema: T;
      handler: (input: never) => Promise<unknown>;
  };


const config = await loadMemaroConfig();

const toolsConfig = config.tools;

const stripSchema = (obj: ZodObject<any>): Record<string, unknown> => {
    const {$schema, ...other} = obj.toJSONSchema();
    return other;
}


const typeExamplesDisplay = Object.entries(config.resources.memory.types).map(([key, value]) => {
    return `\`${key}\`\n${value.description}`;
}).join("");

export const TOOLS: Tool<ZodObject<any>>[] = [
    {
        name: "add_memory",
        description: `${toolsConfig.add_memory.description}\n# Type Examples\n${typeExamplesDisplay}`,
        inputSchema: CreateMemorySchema,
        handler: createMemory,
    },
    {
        name: "get_memory",
        description: toolsConfig.get_memory.description,
        inputSchema: GetMemorySchema,
        handler: getMemory
    },
    {
        name: "update_memory",
        description: toolsConfig.update_memory.description,
        inputSchema: UpdateMemorySchema,
        handler: updateMemory,
    },
    {
        name: "search_memories",
        description: toolsConfig.search_memories.description,
        inputSchema: GetMemoriesSchema,
        handler: getMemories
    },
    {
        name: "remove_memory",
        description: toolsConfig.remove_memory.description,
        inputSchema: RemoveMemorySchema,
        handler: deleteMemory
    },
    {
        name: "link_memory",
        description: toolsConfig.link_memory.description,
        inputSchema: LinkMemoriesSchema,
        handler: createMemoryRelation
    },
    {
        name: "add_tag",
        description: toolsConfig.add_tag.description,
        inputSchema: CreateTagSchema,
        handler: createTag
    },
    {
        name: "search_tags",
        description: toolsConfig.search_tags.description,
        inputSchema: GetTagsSchema,
        handler: getTags
    },
];


export const getTools = () => {
    return TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: stripSchema(tool.inputSchema)
    }));
};
