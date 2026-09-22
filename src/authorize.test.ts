import { describe, expect, it } from 'vitest';
import { requireAdmin, requireOwnMemory } from './authorize.js';
import { ForbiddenError, NotFoundError } from './error.js';
import type { Identity } from './auth.js';

const identity = (overrides: Partial<Identity> = {}): Identity => ({
  userId: '1',
  orgId: '1',
  teamIds: [],
  email: 'user@example.com',
  isServiceAccount: false,
  role: 'member',
  ...overrides,
});

// #6: no instruction-mutating route exists yet (Milestone 1), so this is
// the only place today's "a non-admin is rejected by role" acceptance
// criterion can be exercised — proving the check is ready for whenever
// such a route is added, rather than invented under time pressure then.
describe('requireAdmin', () => {
  it('rejects a member', () => {
    expect(() => requireAdmin(identity({ role: 'member' }))).toThrow(ForbiddenError);
  });

  it('allows an admin', () => {
    expect(() => requireAdmin(identity({ role: 'admin' }))).not.toThrow();
  });
});

describe('requireOwnMemory', () => {
  it('rejects a different user, as 404 rather than 403 (no confirming existence to a non-owner)', () => {
    expect(() => requireOwnMemory(identity({ userId: '1' }), '2')).toThrow(NotFoundError);
  });

  it('allows the owner', () => {
    expect(() => requireOwnMemory(identity({ userId: '1' }), '1')).not.toThrow();
  });
});
