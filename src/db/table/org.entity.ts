import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { TeamEntity } from './team.entity.js';
import { UserEntity } from './user.entity.js';

type OrgAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
};

type CreateOrgAttributes = {
  name: string;
};

@Table({ tableName: 'org' })
export class OrgEntity extends Model<OrgAttributes, CreateOrgAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.TEXT })
  declare name: string;

  @HasMany(() => TeamEntity, { foreignKey: 'orgId' })
  declare teams: TeamEntity[];

  @HasMany(() => UserEntity, { foreignKey: 'orgId' })
  declare users: UserEntity[];
}
