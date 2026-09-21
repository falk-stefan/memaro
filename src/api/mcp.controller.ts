import { Body, Post, Route } from '@tsoa/runtime';
import { McpService } from '../service/mcp.service.js';
import { ApiError } from '../error.js';
import { ToolService } from '../tools/tools.service.js';
import { JsonRpcRequest } from '../dto/mcp.dto.js';

type ToolCallParams = { name: string; arguments?: unknown };

const isToolCallParams = (params: unknown): params is ToolCallParams =>
  typeof params === 'object' &&
  params !== null &&
  typeof (params as Record<string, unknown>).name === 'string';

@Route('/mcp')
export class McpController {
  @Post()
  public async callMcp(@Body() body: JsonRpcRequest) {
    if (body.method.startsWith('notifications/')) {
      return;
    }

    const sessionId = body.id;

    if (typeof sessionId !== 'string') {
      throw new ApiError(403, 'Invalid sessionId');
    }

    switch (body.method) {
      case 'initialize':
        return McpService.initialize(sessionId);
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: sessionId,
          result: {
            tools: await ToolService.getTools(),
          },
        };
      case 'tools/call': {
        if (!isToolCallParams(body.params)) {
          return {
            jsonrpc: '2.0',
            id: sessionId,
            error: { code: -32602, message: 'Invalid params: expected { name, arguments }' },
          };
        }
        const result = await ToolService.callTool(body.params.name, body.params.arguments);
        return { jsonrpc: '2.0', id: sessionId, result };
      }
      default:
        return {
          jsonrpc: '2.0',
          id: sessionId,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        };
    }
  }
}
