import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { MemoryRelationEntity } from './memory-relation.entity.js';
import { MemoryTagEntity } from './memory-tag.entity.js';

type MemoryAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  type: string;
};

type CreateMemoryAttributes = {
  text: string;
  type: string;
};

@Table({ tableName: 'memory' })
export class MemoryEntity extends Model<MemoryAttributes, CreateMemoryAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.TEXT })
  declare text: string;

  @Column({ type: DataType.TEXT })
  declare type: string;

  @HasMany(() => MemoryRelationEntity, { foreignKey: 'sourceId' })
  declare relatedMemories: MemoryRelationEntity[];

  @HasMany(() => MemoryTagEntity, { foreignKey: 'memoryId' })
  declare tags: MemoryTagEntity[];
}
