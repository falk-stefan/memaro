import {Body, Delete, Get, Patch, Path, Post, Queries, Route} from "@tsoa/runtime";
import {type CreateMemory, type MemoryQuery, type UpdateMemory} from "../dto/memory.dto.js";
import {embed} from "../service/embedding.service.js";
import {createMemory, getMemories, updateMemory} from "../service/memory.service.js";


@Route("/v1/memories")
export class MemoryController {
    @Post()
    public async createMemory(@Body() create: CreateMemory) {
        return createMemory(create);
    }

    @Patch('{id}')
    public async updateMemory(
        @Path() id: string,
        @Body() update: UpdateMemory
    ) {
        return updateMemory({id, values: update});
    }

    @Get()
    public async getMemories(@Queries() query: MemoryQuery) {
        return getMemories(query)
    }

    @Get('/{id}')
    public async getMemory(@Path() id: string) {
        return embed("Hello world");
    }

    @Delete('/{id}')
    public deleteMemory(@Path() id: string) {
    }
}