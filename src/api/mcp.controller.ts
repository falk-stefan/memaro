import { Body, Post, Route } from '@tsoa/runtime';
import { McpService } from '../service/mcp.service.js';
import { ApiError } from '../error.js';
import { ToolService } from '../tools/tools.service.js';

@Route('/mcp')
export class McpController {
  @Post()
  public async callMcp(@Body() body: Record<string, unknown>) {
    console.log('call body', JSON.stringify(body, null, 2));

    if (typeof body.method === 'string' && body.method.startsWith('notifications/')) {
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
