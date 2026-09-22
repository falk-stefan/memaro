import { Body, Delete, Get, Patch, Path, Post, Queries, Request, Route } from '@tsoa/runtime';
import type { Request as ExpressRequest } from 'express';
import { type CreateMemory, type MemoryQuery, type UpdateMemory } from '../dto/memory.dto.js';
import { MemoryService } from '../service/memory.service.js';
import { requireIdentity } from '../auth.js';

@Route('/v1/memories')
export class MemoryController {
  @Post()
  public async createMemory(@Body() create: CreateMemory, @Request() request: ExpressRequest) {
    return MemoryService.createMemory(create, requireIdentity(request));
  }

  @Patch('{id}')
  public async updateMemory(
    @Path() id: string,
    @Body() update: UpdateMemory,
    @Request() request: ExpressRequest,
  ) {
    return MemoryService.updateMemory({ id, values: update }, requireIdentity(request));
  }

  @Get()
  public async getMemories(@Queries() query: MemoryQuery, @Request() request: ExpressRequest) {
    return MemoryService.getMemories(query, requireIdentity(request));
  }

  @Delete('/{id}')
  public async deleteMemory(@Path() id: string, @Request() request: ExpressRequest) {
    await MemoryService.deleteMemory({ id }, requireIdentity(request));
  }
}
