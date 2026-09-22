import { BelongsTo, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { MemoryRelationEntity } from './memory-relation.entity.js';
import { MemoryTagEntity } from './memory-tag.entity.js';
import { OrgEntity } from './org.entity.js';
import { UserEntity } from './user.entity.js';

type MemoryAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  type: string;
  orgId: string;
  teamId: string | null;
  userId: string;
};

type CreateMemoryAttributes = {
  text: string;
  type: string;
  orgId: string;
  teamId?: string | null;
  userId: string;
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

  @Column({ type: DataType.BIGINT })
  declare orgId: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare teamId: string | null;

  @Column({ type: DataType.BIGINT })
  declare userId: string;

  @BelongsTo(() => OrgEntity, { foreignKey: 'orgId' })
  declare org: OrgEntity;

  @BelongsTo(() => UserEntity, { foreignKey: 'userId' })
  declare user: UserEntity;

  @HasMany(() => MemoryRelationEntity, { foreignKey: 'sourceId' })
  declare relatedMemories: MemoryRelationEntity[];

  @HasMany(() => MemoryTagEntity, { foreignKey: 'memoryId' })
  declare tags: MemoryTagEntity[];
}
