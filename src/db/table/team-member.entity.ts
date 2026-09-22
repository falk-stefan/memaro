import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { TeamEntity } from './team.entity.js';
import { UserEntity } from './user.entity.js';

type TeamMemberAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  teamId: string;
  userId: string;
};

type CreateTeamMemberAttributes = {
  teamId: string;
  userId: string;
};

@Table({ tableName: 'team_member' })
export class TeamMemberEntity extends Model<TeamMemberAttributes, CreateTeamMemberAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare teamId: string;

  @Column({ type: DataType.BIGINT })
  declare userId: string;

  @BelongsTo(() => TeamEntity, { foreignKey: 'teamId' })
  declare team: TeamEntity;

  @BelongsTo(() => UserEntity, { foreignKey: 'userId' })
  declare user: UserEntity;
}
