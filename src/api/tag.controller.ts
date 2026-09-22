import { Body, Get, Post, Queries, Request, Route } from '@tsoa/runtime';
import type { Request as ExpressRequest } from 'express';
import { TagService } from '../service/tag.service.js';
import { CreateTag, TagQuery } from '../dto/tag.dto.js';
import { requireIdentity } from '../auth.js';

@Route('/v1/tags')
export class TagController {
  @Post()
  public async createTag(@Body() create: CreateTag, @Request() request: ExpressRequest) {
    return TagService.createTag(create, requireIdentity(request));
  }

  @Get()
  public async getTags(@Queries() query: TagQuery, @Request() request: ExpressRequest) {
    return TagService.getTags(query, requireIdentity(request));
  }
}
