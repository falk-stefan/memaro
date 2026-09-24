import { describe, expect, it } from 'vitest';
import { toCallToolResult } from './tools.service.js';

// remove_memory and update_memory return nothing; the resulting text block
// had no `text`, which MCP clients reject as an invalid tools/call result.
describe('toCallToolResult', () => {
  it('produces a text block when the handler returns nothing', () => {
    // when
    const result = toCallToolResult(undefined);

    // then
    expect(result.content[0].text).toBe('{"success":true}');
  });

  it('serializes a handler result as JSON text', () => {
    // when
    const result = toCallToolResult({ id: 1 });

    // then
    expect(result.content[0].text).toBe('{"id":1}');
  });
});
