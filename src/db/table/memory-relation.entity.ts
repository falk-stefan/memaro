import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { MemoryEntity } from './memory.entity.js';

type MemoryRelationAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  sourceId: string;
  targetId: string;
  type: string;
};

type CreateMemoryRelationAttributes = {
  sourceId: string;
  targetId: string;
  type: string;
};

@Table({ tableName: 'related_memory' })
export class MemoryRelationEntity extends Model<
  MemoryRelationAttributes,
  CreateMemoryRelationAttributes
> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare sourceId: string;

  @Column({ type: DataType.TEXT })
  declare type: string;

  @Column({ type: DataType.BIGINT })
  declare targetId: string;

  @BelongsTo(() => MemoryEntity, { foreignKey: 'sourceId', as: 'source' })
  declare source: MemoryEntity;

  @BelongsTo(() => MemoryEntity, { foreignKey: 'targetId', as: 'target' })
  declare target: MemoryEntity;
}
