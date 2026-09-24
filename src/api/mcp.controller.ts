import { Body, Post, Request, Route } from '@tsoa/runtime';
import type { Request as ExpressRequest } from 'express';
import { McpService } from '../service/mcp.service.js';
import { BadRequestError } from '../error.js';
import { ToolService } from '../tools/tools.service.js';
import { JsonRpcRequest } from '../dto/mcp.dto.js';
import { requireIdentity } from '../auth.js';

type ToolCallParams = { name: string; arguments?: unknown };

const isToolCallParams = (params: unknown): params is ToolCallParams =>
  typeof params === 'object' &&
  params !== null &&
  typeof (params as Record<string, unknown>).name === 'string';

@Route('/mcp')
export class McpController {
  @Post()
  public async callMcp(@Body() body: JsonRpcRequest, @Request() request: ExpressRequest) {
    if (body.method.startsWith('notifications/')) {
      return;
    }

    // A JSON-RPC request id only correlates a response with its request —
    // clients may use strings or numbers, and it is echoed back unchanged.
    const id = body.id;

    if (id === undefined) {
      throw new BadRequestError('Missing JSON-RPC request id');
    }

    switch (body.method) {
      case 'initialize':
        return McpService.initialize(id);
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: await ToolService.getTools(),
          },
        };
      case 'tools/call': {
        if (!isToolCallParams(body.params)) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: expected { name, arguments }' },
          };
        }
        const result = await ToolService.callTool(
          body.params.name,
          body.params.arguments,
          requireIdentity(request),
        );
        return { jsonrpc: '2.0', id, result };
      }
      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        };
    }
  }
}
