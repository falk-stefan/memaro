export type JsonRpcId = string | number;

/**
 * The JSON-RPC 2.0 envelope MCP's HTTP transport uses. `params` is
 * intentionally untyped — its shape depends on `method` (e.g. `tools/call`'s
 * `{ name, arguments }` vs `initialize`'s client info), so it's validated
 * inside `McpService`/`ToolService`, not by tsoa's request body schema.
 */
export type JsonRpcRequest = {
  jsonrpc: string;
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
};
