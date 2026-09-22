'use strict';
const { DataTypes } = require('sequelize');

// Backfill target for every row that predates multi-tenancy (#7). A real
// row, not nulls-as-wildcard, so a stray unscoped query can't accidentally
// match "everything" — it matches this one legacy tenant instead.
// `src/cli/backfill-memory-tenant.ts` looks up the same org/user by these
// identifiers to backfill the parallel Qdrant `memory` collection.
const LEGACY_ORG_NAME = 'Legacy';
const LEGACY_USER_EMAIL = 'legacy@memaro.internal';

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();
        const options = { transaction };
        try {
            await queryInterface.addColumn('memory', 'orgId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'org', key: 'id' },
                onDelete: 'CASCADE',
            }, options);
            await queryInterface.addColumn('memory', 'teamId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'team', key: 'id' },
                onDelete: 'CASCADE',
                comment: 'Null for personal memory — set once shared/team memory (Milestone 4) exists.',
            }, options);
            await queryInterface.addColumn('memory', 'userId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'user', key: 'id' },
                onDelete: 'CASCADE',
            }, options);

            await queryInterface.addColumn('tag', 'orgId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'org', key: 'id' },
                onDelete: 'CASCADE',
                comment: 'Tags are an org-scoped controlled vocabulary, not per-user or per-team.',
            }, options);

            await queryInterface.addColumn('related_memory', 'orgId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'org', key: 'id' },
                onDelete: 'CASCADE',
            }, options);
            await queryInterface.addColumn('related_memory', 'userId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'user', key: 'id' },
                onDelete: 'CASCADE',
            }, options);

            // Idempotent lookups, not blind inserts: `down()` only reverses the
            // column additions (see below), so an up/down/up cycle in dev must
            // not fail trying to recreate an already-existing legacy org/user.
            let [[legacyOrg]] = await queryInterface.sequelize.query(
                `SELECT id FROM org WHERE name = :name`,
                { replacements: { name: LEGACY_ORG_NAME }, transaction },
            );
            if (!legacyOrg) {
                [[legacyOrg]] = await queryInterface.sequelize.query(
                    `INSERT INTO org (name, "createdAt", "updatedAt") VALUES (:name, now(), now()) RETURNING id`,
                    { replacements: { name: LEGACY_ORG_NAME }, transaction },
                );
            }

            let [[legacyUser]] = await queryInterface.sequelize.query(
                `SELECT id FROM "user" WHERE email = :email`,
                { replacements: { email: LEGACY_USER_EMAIL }, transaction },
            );
            if (!legacyUser) {
                [[legacyUser]] = await queryInterface.sequelize.query(
                    `INSERT INTO "user" ("orgId", email, "displayName", "isServiceAccount", "createdAt", "updatedAt")
                     VALUES (:orgId, :email, 'Legacy', false, now(), now()) RETURNING id`,
                    { replacements: { orgId: legacyOrg.id, email: LEGACY_USER_EMAIL }, transaction },
                );
            }

            await queryInterface.sequelize.query(
                `UPDATE memory SET "orgId" = :orgId, "userId" = :userId WHERE "orgId" IS NULL`,
                { replacements: { orgId: legacyOrg.id, userId: legacyUser.id }, transaction },
            );
            await queryInterface.sequelize.query(
                `UPDATE tag SET "orgId" = :orgId WHERE "orgId" IS NULL`,
                { replacements: { orgId: legacyOrg.id }, transaction },
            );
            await queryInterface.sequelize.query(
                `UPDATE related_memory SET "orgId" = :orgId, "userId" = :userId WHERE "orgId" IS NULL`,
                { replacements: { orgId: legacyOrg.id, userId: legacyUser.id }, transaction },
            );

            await queryInterface.changeColumn('memory', 'orgId', { type: DataTypes.INTEGER, allowNull: false }, options);
            await queryInterface.changeColumn('memory', 'userId', { type: DataTypes.INTEGER, allowNull: false }, options);
            await queryInterface.changeColumn('tag', 'orgId', { type: DataTypes.INTEGER, allowNull: false }, options);
            await queryInterface.changeColumn('related_memory', 'orgId', { type: DataTypes.INTEGER, allowNull: false }, options);
            await queryInterface.changeColumn('related_memory', 'userId', { type: DataTypes.INTEGER, allowNull: false }, options);

            await queryInterface.removeConstraint('tag', 'tag_name_key', options);
            await queryInterface.removeIndex('tag', 'tag_name_idx', options);
            await queryInterface.addIndex('tag', ['orgId', 'name'], {
                name: 'tag_org_id_name_idx',
                unique: true,
                using: 'BTREE',
                transaction,
            });

            await queryInterface.addIndex('memory', ['orgId'], { name: 'memory_org_id_idx', using: 'BTREE', transaction });
            await queryInterface.addIndex('memory', ['userId'], { name: 'memory_user_id_idx', using: 'BTREE', transaction });
            await queryInterface.addIndex('related_memory', ['orgId'], { name: 'related_memory_org_id_idx', using: 'BTREE', transaction });
            await queryInterface.addIndex('related_memory', ['userId'], { name: 'related_memory_user_id_idx', using: 'BTREE', transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('memory', 'orgId');
        await queryInterface.removeColumn('memory', 'teamId');
        await queryInterface.removeColumn('memory', 'userId');
        await queryInterface.removeColumn('tag', 'orgId');
        await queryInterface.removeColumn('related_memory', 'orgId');
        await queryInterface.removeColumn('related_memory', 'userId');
        await queryInterface.addIndex('tag', ['name'], { name: 'tag_name_idx', using: 'BTREE' });
        await queryInterface.addConstraint('tag', { fields: ['name'], type: 'unique', name: 'tag_name_key' });
    },
};
