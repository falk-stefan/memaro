import {Get, Post, Route} from "@tsoa/runtime";
import {getTools} from "../tools/tools.service.js";

@Route("/mcp")
export class McpController {
    @Get('/tools')
    public async getTools(){
        return getTools()
    }

    @Post('/call')
    public async callTool() {

    }
}