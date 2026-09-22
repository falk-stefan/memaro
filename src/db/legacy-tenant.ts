import { OrgEntity } from './table/org.entity.js';
import { UserEntity } from './table/user.entity.js';

// Same identifiers the `005-tenant-columns` migration backfills existing
// rows to (#7). Stopgap tenant for *new* writes until #8 threads real
// request identity through every service call site — every write path that
// calls this today should be replaced with the caller's real org/user then.
const LEGACY_ORG_NAME = 'Legacy';
const LEGACY_USER_EMAIL = 'legacy@memaro.internal';

let cached: { orgId: string; userId: string } | undefined;

export async function resolveLegacyTenant(): Promise<{ orgId: string; userId: string }> {
  if (cached) {
    return cached;
  }

  const [org, user] = await Promise.all([
    OrgEntity.findOne({ where: { name: LEGACY_ORG_NAME } }),
    UserEntity.findOne({ where: { email: LEGACY_USER_EMAIL } }),
  ]);

  if (!org || !user) {
    throw new Error(
      'Legacy tenant not found — run the "005-tenant-columns" migration (pnpm db:migrate) first.',
    );
  }

  cached = { orgId: org.id, userId: user.id };
  return cached;
}
