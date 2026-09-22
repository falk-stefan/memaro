import { Body, Delete, Patch, Path, Post, Request, Route } from '@tsoa/runtime';
import type { Request as ExpressRequest } from 'express';
import {
  type CreateMemoryRelation,
  type UpdateMemoryRelation,
} from '../dto/memory-relation.dto.js';
import { MemoryRelationsService } from '../service/memory-relations.service.js';
import { requireIdentity } from '../auth.js';

@Route('/v1/memory-relations')
export class MemoryRelationsController {
  @Post()
  public async createMemoryRelation(
    @Body() create: CreateMemoryRelation,
    @Request() request: ExpressRequest,
  ) {
    return MemoryRelationsService.createMemoryRelation(create, requireIdentity(request));
  }

  @Patch('{id}')
  public async updateMemoryRelation(
    @Path() id: string,
    @Body() update: UpdateMemoryRelation,
    @Request() request: ExpressRequest,
  ) {
    return MemoryRelationsService.updateMemoryRelations(
      { id, values: update },
      requireIdentity(request),
    );
  }

  @Delete('/{id}')
  public async deleteMemoryRelation(@Path() id: string, @Request() request: ExpressRequest) {
    await MemoryRelationsService.deleteMemoryRelations(id, requireIdentity(request));
  }
}
