import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { UserEntity } from './user.entity.js';

type ApiKeyAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  keyHash: string;
  label: string | null;
  revokedAt: Date | null;
};

type CreateApiKeyAttributes = {
  userId: string;
  keyHash: string;
  label: string | null;
};

@Table({ tableName: 'api_key' })
export class ApiKeyEntity extends Model<ApiKeyAttributes, CreateApiKeyAttributes> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.BIGINT })
  declare userId: string;

  @Column({ type: DataType.TEXT })
  declare keyHash: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare label: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare revokedAt: Date | null;

  @BelongsTo(() => UserEntity, { foreignKey: 'userId' })
  declare user: UserEntity;
}
