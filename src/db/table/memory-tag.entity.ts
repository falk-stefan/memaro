import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { MemoryEntity } from './memory.entity.js';
import { TagEntity } from './tag.entity.js';

type MemoryTagAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  memoryId: string;
  tagId: string;
};

type CreateMemoryTagAttributes = {
  memoryId: string;
  tagId: string;
};

@Table({ tableName: 'memory_tag' })
export class MemoryTagEntity extends Model<MemoryTagAttributes, CreateMemoryTagAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare memoryId: string;

  @Column({ type: DataType.BIGINT })
  declare tagId: string;

  @BelongsTo(() => MemoryEntity, { foreignKey: 'memoryId' })
  declare memory: MemoryEntity;

  @BelongsTo(() => TagEntity, { foreignKey: 'tagId' })
  declare tag: TagEntity;
}
