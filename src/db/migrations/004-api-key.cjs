'use strict';
const { DataTypes } = require('sequelize');

const ApiKeyTable = {
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
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    keyHash: {
        allowNull: false,
        type: DataTypes.TEXT,
        comment: 'sha256 hex digest of the raw key — the raw key itself is never stored.',
    },
    label: {
        allowNull: true,
        type: DataTypes.TEXT,
        comment: 'Human-readable label set at issuance, e.g. "CI agent".',
    },
    revokedAt: {
        allowNull: true,
        type: DataTypes.DATE,
    },
}

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();
        const options = { transaction };
        try {
            await queryInterface.createTable('api_key', ApiKeyTable, options);
            await queryInterface.addIndex('api_key', ['keyHash'], {
                name: 'api_key_key_hash_idx',
                unique: true,
                using: 'BTREE',
                transaction,
            });
            await queryInterface.addIndex('api_key', ['userId'], {
                name: 'api_key_user_id_idx',
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
        await queryInterface.dropTable('api_key');
    },
};
