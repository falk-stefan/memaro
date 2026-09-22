import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOLS, ToolService } from './tools/tools.service.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { sequelizeClient } from './db/sequelize.js';
import express, { json, urlencoded } from 'express';
import { RegisterRoutes } from './routes.js';
import { ApiError } from './error.js';
import { apiKeyAuth } from './auth.js';

/**
 * Main function for the express server.
 */
async function expressMain() {
  // Initialize database
  await sequelizeClient.sync();

  const app = express();

  app.use(
    urlencoded({
      extended: true,
    }),
  );

  app.use(json());

  app.get('/', (req, res) => {
    res.send('Hello World!!');
  });
  app.post('/', (req, res) => {
    res.send('Hello World!!');
  });

  // Everything below requires a valid API key — '/' above is the only
  // unauthenticated route, serving as a health check.
  app.use(apiKeyAuth);

  RegisterRoutes(app);

  app.use(
    (err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) {
        return next(err);
      }

      if (err instanceof ApiError) {
        return res.status(err.code).send(err);
      }

      res.status(500).send(new ApiError(500, 'An unexpected error occurred.'));
    },
  );

  const PORT = process.env.PORT ?? 2999;
  app.listen(PORT, () => {
    console.error(`Memaro MCP REST API running on http://localhost:${PORT}`);
  });
}

/**
 * Creates an MCP server with the given mode.
 */
function createMcpServer() {
  const server = new McpServer({
    name: 'memaro',
    version: '0.0.1',
  });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (input) => ToolService.callTool(tool.name, input),
    );
  }

  return server;
}

/**
 * Main function for the stdio MCP server.
 */
async function stdioMain() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memaro MCP Server running on stdio');
}

function main(mode: string = 'standalone') {
  if (!['client', 'standalone', 'server'].includes(mode)) {
    throw new Error(`Unknown mode: ${mode}`);
  }

  console.error('Memaro starting in mode:', mode);

  switch (mode) {
    case 'client':
      stdioMain().catch((error) => {
        console.error('Fatal error in main():', error);
        process.exit(1);
      });
      break;
    case 'standalone':
      stdioMain().catch((error) => {
        console.error('Fatal error in main():', error);
        process.exit(1);
      });
      expressMain().then();
      break;
    case 'server':
      expressMain().then();
      break;
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}

main(process.argv[2]);
