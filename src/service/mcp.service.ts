import type { JsonRpcId } from '../dto/mcp.dto.js';

export class McpService {
  static async initialize(id: JsonRpcId) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'memaro-http',
          version: '1.0.0',
        },
      },
    };
  }
}
