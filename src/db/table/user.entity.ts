import { BelongsTo, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { OrgEntity } from './org.entity.js';
import { TeamMemberEntity } from './team-member.entity.js';

export type UserRole = 'member' | 'admin';

type UserAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  orgId: string;
  email: string;
  displayName: string;
  isServiceAccount: boolean;
  role: UserRole;
};

type CreateUserAttributes = {
  orgId: string;
  email: string;
  displayName: string;
  isServiceAccount: boolean;
  role: UserRole;
};

@Table({ tableName: 'user' })
export class UserEntity extends Model<UserAttributes, CreateUserAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare orgId: string;

  @Column({ type: DataType.TEXT })
  declare email: string;

  @Column({ type: DataType.TEXT })
  declare displayName: string;

  @Column({ type: DataType.BOOLEAN })
  declare isServiceAccount: boolean;

  @Column({ type: DataType.STRING(16) })
  declare role: UserRole;

  @BelongsTo(() => OrgEntity, { foreignKey: 'orgId' })
  declare org: OrgEntity;

  @HasMany(() => TeamMemberEntity, { foreignKey: 'userId' })
  declare teamMemberships: TeamMemberEntity[];
}
