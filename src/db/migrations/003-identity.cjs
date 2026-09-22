'use strict';
const { DataTypes } = require('sequelize');

// Schema review against the "hundreds of teams" scale requirement (#3):
// four small, normalized tables. `org`/`team`/`user` each top out in the
// thousands of rows at that scale, and `team_member` — the only table that
// grows with team size — stays in the tens of thousands. A btree index
// covers every lookup this milestone needs (by org, by team, by user's
// memberships); no denormalization (e.g. caching a user's team_id array)
// is warranted yet. Revisit only if either per-request RBAC checks (#6)
// or team_member's row count grow by orders of magnitude beyond this.

const OrgTable = {
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
    type: DataTypes.TEXT,
  },
};

const TeamTable = {
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
  orgId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'org',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  name: {
    allowNull: false,
    type: DataTypes.TEXT,
  },
};

const UserTable = {
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
  orgId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'org',
      key: 'id',
    },
    onDelete: 'CASCADE',
    comment: 'Stored directly rather than derived via team_member — see #3.',
  },
  email: {
    allowNull: false,
    type: DataTypes.TEXT,
  },
  displayName: {
    allowNull: false,
    type: DataTypes.TEXT,
  },
  isServiceAccount: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Non-human identity, e.g. the consolidation worker (#9).',
  },
};

const TeamMemberTable = {
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
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'team',
      key: 'id',
    },
    onDelete: 'CASCADE',
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
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const options = { transaction };
    try {
      await queryInterface.createTable('org', OrgTable, options);
      await queryInterface.createTable('team', TeamTable, options);
      await queryInterface.createTable('user', UserTable, options);
      await queryInterface.createTable('team_member', TeamMemberTable, options);

      await queryInterface.addIndex('team', ['orgId'], {
        name: 'team_org_id_idx',
        using: 'BTREE',
        transaction,
      });
      await queryInterface.addIndex('team', ['orgId', 'name'], {
        name: 'team_org_id_name_idx',
        unique: true,
        using: 'BTREE',
        transaction,
      });
      await queryInterface.addIndex('user', ['orgId'], {
        name: 'user_org_id_idx',
        using: 'BTREE',
        transaction,
      });
      await queryInterface.addIndex('user', ['email'], {
        name: 'user_email_idx',
        unique: true,
        using: 'BTREE',
        transaction,
      });
      await queryInterface.addIndex('team_member', ['teamId', 'userId'], {
        name: 'team_member_team_id_user_id_idx',
        unique: true,
        using: 'BTREE',
        transaction,
      });
      await queryInterface.addIndex('team_member', ['userId'], {
        name: 'team_member_user_id_idx',
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
    await queryInterface.dropTable('team_member');
    await queryInterface.dropTable('user');
    await queryInterface.dropTable('team');
    await queryInterface.dropTable('org');
  },
};
