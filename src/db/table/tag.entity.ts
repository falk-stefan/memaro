import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { OrgEntity } from './org.entity.js';

type TagAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  orgId: string;
};

type CreateTagAttributes = {
  name: string;
  description: string;
  orgId: string;
};

@Table({ tableName: 'tag' })
export class TagEntity extends Model<TagAttributes, CreateTagAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.TEXT })
  declare name: string;

  @Column({ type: DataType.TEXT })
  declare description: string;

  @Column({ type: DataType.BIGINT })
  declare orgId: string;

  @BelongsTo(() => OrgEntity, { foreignKey: 'orgId' })
  declare org: OrgEntity;
}
