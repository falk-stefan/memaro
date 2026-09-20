import { Body, Delete, Patch, Path, Post, Route } from '@tsoa/runtime';
import {
  type CreateMemoryRelation,
  type UpdateMemoryRelation,
} from '../dto/memory-relation.dto.js';
import { MemoryRelationsService } from '../service/memory-relations.service.js';

@Route('/v1/memory-relations')
export class MemoryRelationsController {
  @Post()
  public async createMemoryRelation(@Body() create: CreateMemoryRelation) {
    return MemoryRelationsService.createMemoryRelation(create);
  }

  @Patch('{id}')
  public async updateMemoryRelation(@Path() id: string, @Body() update: UpdateMemoryRelation) {
    return MemoryRelationsService.updateMemoryRelations({ id, values: update });
  }

  @Delete('/{id}')
  public async deleteMemoryRelation(@Path() id: string) {
    await MemoryRelationsService.deleteMemoryRelations(id);
  }
}
