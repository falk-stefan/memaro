import { describe, expect, it } from 'vitest';
import type { Request as ExpressRequest } from 'express';
import { McpController } from './mcp.controller.js';
import { BadRequestError } from '../error.js';

// Standard MCP clients (e.g. Claude Code over HTTP) send numeric JSON-RPC ids.
// The endpoint used to reject every non-string id with a 403, which made the
// HTTP transport unusable for any spec-compliant client.
describe('McpController JSON-RPC ids', () => {
  const controller = new McpController();
  const request = {} as ExpressRequest;

  it.each([0, 1, 'abc'])('echoes id %j back on initialize', async (id) => {
    // given
    const body = { jsonrpc: '2.0', id, method: 'initialize', params: {} };

    // when
    const response = await controller.callMcp(body, request);

    // then
    expect(response).toMatchObject({ jsonrpc: '2.0', id });
  });

  it('echoes a numeric id back on tools/list', async () => {
    // given
    const body = { jsonrpc: '2.0', id: 2, method: 'tools/list' };

    // when
    const response = await controller.callMcp(body, request);

    // then
    expect(response).toMatchObject({ jsonrpc: '2.0', id: 2 });
  });

  it('rejects a request without an id', async () => {
    // given
    const body = { jsonrpc: '2.0', method: 'tools/list' };

    // when
    const call = controller.callMcp(body, request);

    // then
    await expect(call).rejects.toBeInstanceOf(BadRequestError);
  });

  it('accepts notifications, which carry no id', async () => {
    // given
    const body = { jsonrpc: '2.0', method: 'notifications/initialized' };

    // when
    const response = await controller.callMcp(body, request);

    // then
    expect(response).toBeUndefined();
  });
});

describe('McpController initialize', () => {
  it('advertises the tools capability in the spec shape, not tool descriptions', async () => {
    // given
    const body = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} };

    // when
    const response = await new McpController().callMcp(body, {} as ExpressRequest);

    // then
    expect(response).toMatchObject({ result: { capabilities: { tools: {} } } });
    const { result } = response as { result: { capabilities: { tools: object } } };
    expect(Object.keys(result.capabilities.tools)).toEqual([]);
  });
});
