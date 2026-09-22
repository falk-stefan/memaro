import { loadMemaroConfig } from '../tools/tools.config.js';

export class McpService {
  static async initialize(sessionId: string) {
    const config = await loadMemaroConfig();

    return {
      jsonrpc: '2.0',
      id: sessionId,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: config.tools,
        },
        serverInfo: {
          name: 'memaro-http',
          version: '1.0.0',
        },
      },
    };
  }
}
