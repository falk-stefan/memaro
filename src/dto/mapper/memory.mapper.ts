import {Memory, MemorySearchResult} from "../memory.dto.js";
import {MemoryRelation} from "../memory-relation.dt.js";
import {MemoryEntity} from "../../db/table/memory.entity.js";
import {MemoryRelationEntity} from "../../db/table/memory-relation.entity.js";

export const toMemory = (entity: MemoryEntity): Memory => ({
    id: entity.dataValues.id,
    createdAt: entity.dataValues.createdAt,
    text: entity.dataValues.text,
    type: entity.dataValues.type,
    relatedMemories: []
});

export const toMemorySearchResult = (
    memories: MemoryEntity[],
    scores: Array<{ id: number | string; score: number }>
): MemorySearchResult =>
    memories.map((memory) => {
        const scoredMemory = scores.find(r => r.id === Number(memory.id));
        return {
            id: memory.dataValues.id,
            createdAt: memory.dataValues.createdAt,
            text: memory.dataValues.text,
            type: memory.dataValues.type,
            relatedMemories: memory.relatedMemories.map(r => ({
                targetId: r.targetId,
                text: r.target.text,
                type: r.type
            })),
            score: scoredMemory?.score ?? 0
        };
    }) as MemorySearchResult;

export const toMemoryRelation = (entity: MemoryRelationEntity): MemoryRelation => ({
    ...entity.dataValues
});
