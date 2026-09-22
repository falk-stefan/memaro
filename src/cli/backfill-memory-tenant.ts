import { qdrantClient } from '../db/qdrant.js';
import { sequelizeClient } from '../db/sequelize.js';
import { resolveLegacyTenant } from '../db/legacy-tenant.js';

/**
 * One-off companion to the `005-tenant-columns` Postgres migration (#7):
 * Qdrant has no migration framework of its own, so existing `memory`
 * collection points are backfilled here instead, to the same legacy
 * org/user the SQL migration used. Safe to re-run — only touches points
 * missing a tenant field.
 */
async function main(): Promise<void> {
  await sequelizeClient.authenticate();
  const tenant = await resolveLegacyTenant();

  let offset: string | number | Record<string, unknown> | null | undefined;
  let scanned = 0;
  let updated = 0;

  do {
    const page = await qdrantClient.scroll('memory', {
      limit: 100,
      offset,
      with_payload: true,
    });

    const toUpdate = page.points.filter(
      (point) => !point.payload || point.payload.orgId === undefined,
    );

    if (toUpdate.length > 0) {
      await qdrantClient.setPayload('memory', {
        wait: true,
        points: toUpdate.map((point) => point.id),
        payload: { orgId: tenant.orgId, userId: tenant.userId },
      });
      updated += toUpdate.length;
    }

    scanned += page.points.length;
    offset = page.next_page_offset ?? undefined;
  } while (offset !== undefined && offset !== null);

  console.log(`Scanned ${scanned} memory points, backfilled tenant on ${updated}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error while backfilling memory tenant:', error);
    process.exit(1);
  });
