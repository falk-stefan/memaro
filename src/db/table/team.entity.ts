import { BelongsTo, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { OrgEntity } from './org.entity.js';
import { TeamMemberEntity } from './team-member.entity.js';

type TeamAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  orgId: string;
  name: string;
};

type CreateTeamAttributes = {
  orgId: string;
  name: string;
};

@Table({ tableName: 'team' })
export class TeamEntity extends Model<TeamAttributes, CreateTeamAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare orgId: string;

  @Column({ type: DataType.TEXT })
  declare name: string;

  @BelongsTo(() => OrgEntity, { foreignKey: 'orgId' })
  declare org: OrgEntity;

  @HasMany(() => TeamMemberEntity, { foreignKey: 'teamId' })
  declare members: TeamMemberEntity[];
}
