import { createHash, randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ApiKeyEntity } from './db/table/api-key.entity.js';
import { UserEntity, type UserRole } from './db/table/user.entity.js';
import { TeamMemberEntity } from './db/table/team-member.entity.js';
import { UnauthorizedError } from './error.js';

// API keys are a stopgap credential for agents, not the final human login
// story — SSO is deferred to Milestone 7 (#4).

export type Identity = {
  userId: string;
  orgId: string;
  teamIds: string[];
  email: string;
  isServiceAccount: boolean;
  role: UserRole;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Identity;
    }
  }
}

const API_KEY_PREFIX = 'mmr_';

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawKey = `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
  return { rawKey, keyHash: hashApiKey(rawKey) };
}

export function parseBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export async function resolveApiKey(rawKey: string): Promise<Identity | null> {
  const apiKey = await ApiKeyEntity.findOne({
    where: { keyHash: hashApiKey(rawKey), revokedAt: null },
  });

  if (!apiKey) {
    return null;
  }

  const user = await UserEntity.findByPk(apiKey.userId);

  if (!user) {
    return null;
  }

  const memberships = await TeamMemberEntity.findAll({ where: { userId: user.id } });

  return {
    userId: user.id,
    orgId: user.orgId,
    teamIds: memberships.map((membership) => membership.teamId),
    email: user.email,
    isServiceAccount: user.isServiceAccount,
    role: user.role,
  };
}

/**
 * Reject-by-default middleware: every route it guards requires a valid,
 * non-revoked API key. Resolves `Authorization: Bearer <key>` to a user +
 * team + org identity on `req.user` before any controller runs.
 */
export async function apiKeyAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = parseBearerToken(req.header('authorization'));

  if (!token) {
    throw new UnauthorizedError();
  }

  const identity = await resolveApiKey(token);

  if (!identity) {
    throw new UnauthorizedError();
  }

  req.user = identity;
  next();
}

/**
 * Narrows `req.user` (optional, since it's set by middleware rather than
 * the type system) to `Identity` for controllers — every route reaching a
 * controller already passed `apiKeyAuth`, so this should never actually be
 * undefined; the check is defense in depth, not the primary enforcement.
 */
export function requireIdentity(req: Request): Identity {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  return req.user;
}
