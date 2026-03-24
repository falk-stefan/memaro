import {RelatedMemory} from "./memory-relation.dt.js";
import {CreateMemorySchema, GetMemoriesSchema, UpdateMemorySchema} from "../tools/tools.schema.js";
import {z} from "zod";

// export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export type CreateMemory = z.infer<typeof CreateMemorySchema>

export type UpdateMemory = z.infer<typeof UpdateMemorySchema>['values']

export type Memory = {
    id: string;
    text: string;
    createdAt: Date;
    type: string;
    relatedMemories: RelatedMemory[];
}

export type MemorySearchResult = (Memory & { score: number;})[]

export type MemoryQuery = z.infer<typeof GetMemoriesSchema>
