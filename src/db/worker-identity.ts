import { QueryTypes, type Sequelize } from 'sequelize';

const REQUIRED_WORKER_ROLE = 'memaro_worker';

/**
 * Fails loudly if a connection isn't actually authenticated as
 * `memaro_worker` (#9) — the consolidation worker (Milestone 4) must call
 * this at startup and refuse to run otherwise, so a misconfigured deploy
 * can never silently fall back to the app's own admin/ORM connection.
 */
export async function assertWorkerIdentity(sequelize: Sequelize): Promise<void> {
  const [row] = await sequelize.query<{ current_user: string }>('SELECT current_user', {
    type: QueryTypes.SELECT,
  });

  if (row?.current_user !== REQUIRED_WORKER_ROLE) {
    throw new Error(
      `Refusing to start: connected as "${row?.current_user}", not "${REQUIRED_WORKER_ROLE}". ` +
        `The consolidation worker must use its own DB role, never the app's connection string.`,
    );
  }
}
