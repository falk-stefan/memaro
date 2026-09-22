'use strict';
const { DataTypes } = require('sequelize');

const InstructionDocTable = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    title: {
        allowNull: false,
        type: DataTypes.TEXT,
    },
    body: {
        allowNull: false,
        type: DataTypes.TEXT,
    },
    contextTags: {
        allowNull: false,
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
    },
    scope: {
        allowNull: false,
        type: DataTypes.STRING(16),
        comment: 'org | team | repo — ranking signal until Milestone 2 enforces it as a hard filter.',
    },
    owner: {
        allowNull: true,
        type: DataTypes.TEXT,
    },
    lastReviewed: {
        allowNull: true,
        type: DataTypes.DATEONLY,
    },
    sourceId: {
        allowNull: false,
        type: DataTypes.TEXT,
        comment: 'ContentSource.id, e.g. "local:agent-instructions".',
    },
    sourcePath: {
        allowNull: false,
        type: DataTypes.TEXT,
        comment: 'RawDoc.externalId — path within the source.',
    },
    sourceUrl: {
        allowNull: false,
        type: DataTypes.TEXT,
    },
    contentHash: {
        allowNull: false,
        type: DataTypes.TEXT,
        comment: 'sha256 of raw content — idempotency key and change-detection signal.',
    },
    acl: {
        allowNull: true,
        type: DataTypes.JSONB,
        comment: 'Stub until a source with real page-level ACLs exists.',
    },
}

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();
        const options = { transaction };
        try {
            await queryInterface.createTable('instruction_doc', InstructionDocTable, options);
            await queryInterface.addIndex('instruction_doc', ['sourceId', 'sourcePath'], {
                name: 'instruction_doc_source_path_idx',
                unique: true,
                using: 'BTREE',
                transaction,
            });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('instruction_doc');
    },
};
