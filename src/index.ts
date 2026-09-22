import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOLS, ToolService } from './tools/tools.service.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { sequelizeClient } from './db/sequelize.js';
import express, { json, urlencoded } from 'express';
import { RegisterRoutes } from './routes.js';
import { ApiError } from './error.js';
import { apiKeyAuth, resolveApiKey, type Identity } from './auth.js';

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
 * Creates an MCP server bound to a single, already-resolved identity — a
 * stdio session's identity is fixed for its lifetime (#5), so it's
 * captured once here rather than re-resolved per tool call.
 */
function createMcpServer(identity: Identity) {
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
      async (input) => ToolService.callTool(tool.name, input, identity),
    );
  }

  return server;
}

/**
 * Resolves the stdio session's identity once, at process startup, from
 * `MEMARO_API_KEY` — reusing the same resolution logic HTTP auth uses
 * (#4). A stdio process has no per-call headers, so this is the only
 * chance to bind identity; a missing or invalid key fails loudly rather
 * than falling back to a silent anonymous session. Kept local to
 * stdioMain() rather than shared module state, so it can never leak into
 * `standalone` mode's independently-authenticated HTTP requests.
 */
async function resolveStdioIdentity(): Promise<Identity> {
  const apiKey = process.env.MEMARO_API_KEY;

  if (!apiKey) {
    throw new Error(
      'MEMARO_API_KEY is required to start stdio mode — see README "Connecting via stdio".',
    );
  }

  const identity = await resolveApiKey(apiKey);

  if (!identity) {
    throw new Error('MEMARO_API_KEY is invalid or has been revoked.');
  }

  return identity;
}

/**
 * Main function for the stdio MCP server.
 */
async function stdioMain() {
  const identity = await resolveStdioIdentity();
  const server = createMcpServer(identity);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Memaro MCP Server running on stdio as ${identity.email} (org ${identity.orgId})`);
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
