import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOOLS } from './tools/tools.service.js';

// Milestone 1, Iteration 5: instruction documents must never be reachable
// through any agent-facing write path — the only writer is the trusted
// ingestion pipeline (Iteration 3), which no request handler can invoke.
// This test is the enforcement mechanism named in the roadmap: it fails the
// moment either surface gains a mutating instruction route, rather than
// relying on someone remembering to check during review.
describe('instruction_doc is read-only from every agent-facing surface', () => {
  it('exposes exactly one instruction-related MCP tool: read_instructions', () => {
    const instructionTools = TOOLS.filter((tool) => tool.name.includes('instruction')).map(
      (tool) => tool.name,
    );

    expect(instructionTools).toEqual(['read_instructions']);
  });

  it('registers no mutating REST route under /v1/instructions', () => {
    const spec = JSON.parse(readFileSync('dist/swagger.json', 'utf-8')) as {
      paths: Record<string, Record<string, unknown>>;
    };

    const instructionPaths = Object.entries(spec.paths).filter(([path]) =>
      path.startsWith('/v1/instructions'),
    );

    expect(instructionPaths.length).toBeGreaterThan(0);

    for (const [, methods] of instructionPaths) {
      expect(Object.keys(methods)).toEqual(['get']);
    }
  });
});
