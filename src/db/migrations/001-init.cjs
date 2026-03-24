'use strict';
const { DataTypes } = require('sequelize');

const MemoryTable = {
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
    text: {
        allowNull: false,
        type: DataTypes.STRING(320),
    },
    type: {
        allowNull: false,
        type: DataTypes.STRING(16),
        comment: 'The type of the memory.'
    },
}

const RelatedMemoryTable = {
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
    sourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'memory',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    targetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'memory',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    type: {
        type: DataTypes.STRING(16),
        comment: 'The type of the relation between the source and target memory.'
    },
}

const TagTable = {
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
    name: {
        allowNull: false,
        type: DataTypes.STRING(32),
        unique: true,
    },
    description: {
        allowNull: false,
        type: DataTypes.STRING(320),
    },
}

const MemoryTagTable = {
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
    memoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'memory',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tag',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}

module.exports = {
    async up(queryInterface, Sequelize) {

        const transaction = await queryInterface.sequelize.transaction();
        const options = { transaction };
        try {
            await queryInterface.createTable('tag', TagTable, options);
            await queryInterface.createTable('memory', MemoryTable, options);
            await queryInterface.createTable('related_memory', RelatedMemoryTable, options);
            await queryInterface.createTable('memory_tag', MemoryTagTable, options);
            await queryInterface.addIndex('tag', ['name'], {
                name: 'tag_name_idx',
                using: 'BTREE',
                transaction
            })
            await transaction.commit()
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    },

    async down(queryInterface) {
        await queryInterface.dropTable('memory_tag');
        await queryInterface.dropTable('related_memory');
        await queryInterface.dropTable('memory');
        await queryInterface.dropTable('tag');
    },
};