'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();
        const options = { transaction };
        try {
            await queryInterface.addColumn('user', 'role', {
                type: DataTypes.STRING(16),
                allowNull: false,
                defaultValue: 'member',
                comment: 'member | admin — org-scoped (user.orgId is the org this applies to).',
            }, options);

            await queryInterface.addColumn('team', 'consolidationMode', {
                type: DataTypes.STRING(16),
                allowNull: false,
                defaultValue: 'shadow',
                comment: 'shadow | live — field only; Milestone 6 is what acts on it. Admin-only to mutate.',
            }, options);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('user', 'role');
        await queryInterface.removeColumn('team', 'consolidationMode');
    },
};
