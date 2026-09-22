import type { Identity } from './auth.js';
import { ForbiddenError, NotFoundError } from './error.js';

/**
 * Thin RBAC layer (#6) built on top of the identity #4/#5/#8 already
 * resolve — coarse role + ownership checks, not a policy engine. Three
 * rules matter for now: instructions are admin-only to mutate (defense in
 * depth on top of Milestone 1's structural read-only-ness — no mutating
 * route exists yet, but the check is ready for when one does), personal
 * memory is owner-only, and shared memory (Milestone 4) will be
 * team/org-readable and worker-only to write.
 */

/** Instructions writable only by an org admin. No mutating route exists
 * yet (Milestone 1) — this is here so one can be added straight onto this
 * check rather than inventing RBAC under time pressure later. */
export function requireAdmin(identity: Identity): void {
  if (identity.role !== 'admin') {
    throw new ForbiddenError('Requires an admin role.');
  }
}

/**
 * Personal memory is readable/writable only by its owner. A 404, not a
 * 403 — an unauthorized caller shouldn't be able to tell another user's
 * memory exists at all (classic IDOR defense).
 */
export function requireOwnMemory(identity: Identity, ownerUserId: string): void {
  if (identity.userId !== ownerUserId) {
    throw new NotFoundError('memory');
  }
}
