import { Sequelize } from 'sequelize';
import { assertWorkerIdentity } from '../db/worker-identity.js';

/**
 * Manual verification for #9's second acceptance criterion, and the check
 * the real consolidation worker (Milestone 4) will run at its own
 * startup: confirms a connection string is actually authenticated as
 * memaro_worker, refusing otherwise — e.g. point this at the app's own
 * admin connection string to see it correctly refuse.
 *
 * Usage:
 *   MEMARO_WORKER_DB_URL=postgres://memaro_worker:<password>@localhost:5433/memaro \
 *     pnpm check-worker-identity
 */
async function main(): Promise<void> {
  const url = process.env.MEMARO_WORKER_DB_URL;

  if (!url) {
    throw new Error('MEMARO_WORKER_DB_URL is required.');
  }

  const sequelize = new Sequelize(url, { logging: false });

  try {
    await assertWorkerIdentity(sequelize);
    console.log('OK: connected as memaro_worker.');
  } finally {
    await sequelize.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error((error as Error).message);
    process.exit(1);
  });
