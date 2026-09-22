'use strict';

const WORKER_ROLE = 'memaro_worker';
// Dev-only placeholder, matching the existing hardcoded postgres/postgres
// app credentials (src/db/config/config.cjs) — production must manage this
// via real secrets infrastructure, not this migration.
const WORKER_PASSWORD = 'memaro_worker_dev_password';

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.sequelize.query(
                `DO $$
                 BEGIN
                     IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${WORKER_ROLE}') THEN
                         CREATE ROLE ${WORKER_ROLE} LOGIN PASSWORD '${WORKER_PASSWORD}';
                     END IF;
                 END
                 $$;`,
                { transaction },
            );

            await queryInterface.sequelize.query(
                `GRANT CONNECT ON DATABASE memaro TO ${WORKER_ROLE};`,
                { transaction },
            );
            await queryInterface.sequelize.query(
                `GRANT USAGE ON SCHEMA public TO ${WORKER_ROLE};`,
                { transaction },
            );

            // SELECT-only on memory/tag/related_memory — read access for
            // future consolidation reads (Milestone 4), never write; the
            // worker's own tables (shared_memory, consolidation_run, etc.)
            // don't exist yet, so SELECT/INSERT/UPDATE grants on those are
            // deferred to whichever Milestone 4 migration creates them.
            // Deliberately NO grant at all on instruction_doc (or the future
            // instruction_suggestion) — Milestone 1's "agents never write
            // instructions" invariant holds at the DB level even for this
            // one process that #6's app-level RBAC doesn't gate.
            await queryInterface.sequelize.query(
                `GRANT SELECT ON memory, tag, related_memory TO ${WORKER_ROLE};`,
                { transaction },
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            `REVOKE SELECT ON memory, tag, related_memory FROM ${WORKER_ROLE};`,
        );
        await queryInterface.sequelize.query(`REVOKE USAGE ON SCHEMA public FROM ${WORKER_ROLE};`);
        await queryInterface.sequelize.query(
            `REVOKE CONNECT ON DATABASE memaro FROM ${WORKER_ROLE};`,
        );
        await queryInterface.sequelize.query(`DROP ROLE IF EXISTS ${WORKER_ROLE};`);
    },
};
