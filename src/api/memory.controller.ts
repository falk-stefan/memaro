import {Body, Delete, Get, Patch, Path, Post, Queries, Route} from "@tsoa/runtime";
import {type CreateMemory, type MemoryQuery, type UpdateMemory} from "../dto/memory.dto.js";
import {MemoryService} from "../service/memory.service.js";


@Route("/v1/memories")
export class MemoryController {
    @Post()
    public async createMemory(@Body() create: CreateMemory) {
        return MemoryService.createMemory(create);
    }

    @Patch('{id}')
    public async updateMemory(
        @Path() id: string,
        @Body() update: UpdateMemory
    ) {
        return MemoryService.updateMemory({id, values: update});
    }

    @Get()
    public async getMemories(@Queries() query: MemoryQuery) {
        return MemoryService.getMemories(query)
    }

    @Delete('/{id}')
    public async deleteMemory(@Path() id: string) {
        await MemoryService.deleteMemory(id);
    }
}