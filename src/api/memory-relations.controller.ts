import {Body, Patch, Path, Post, Route} from "@tsoa/runtime";
import {type CreateMemoryRelation, type UpdateMemoryRelation} from "../dto/memory-relation.dt.js";
import {createMemoryRelation, updateMemoryRelations} from "../service/memory-relations.service.js";

@Route("/v1/memory-relations")
export class MemoryRelationsController {

    @Post()
    public async createMemoryRelation(@Body() create: CreateMemoryRelation) {
        return createMemoryRelation(create)
    }

    @Patch('{id}')
    public async updateMemoryRelation(
        @Path() id: string,
        @Body() update: UpdateMemoryRelation) {
        return updateMemoryRelations({id, values: update})
    }
}