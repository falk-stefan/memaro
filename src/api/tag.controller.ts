import {Body, Get, Post, Queries, Route} from "@tsoa/runtime";
import {createTag, getTags} from "../service/tag.service.js";
import {CreateTag, TagQuery} from "../dto/tag.dto.js";


@Route("/v1/tags")
export class TagController {
    @Post()
    public async createTag(@Body() create: CreateTag) {
        return createTag(create);
    }

    @Get()
    public async getTags(@Queries() query: TagQuery) {
        return getTags(query)
    }

}