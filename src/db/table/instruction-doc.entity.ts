import { Column, DataType, Model, Table } from 'sequelize-typescript';

type InstructionDocAttributes = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  body: string;
  contextTags: string[];
  scope: string;
  owner: string | null;
  lastReviewed: Date | null;
  sourceId: string;
  sourcePath: string;
  sourceUrl: string;
  contentHash: string;
  acl: Record<string, unknown> | null;
};

type CreateInstructionDocAttributes = {
  title: string;
  body: string;
  contextTags: string[];
  scope: string;
  owner: string | null;
  lastReviewed: Date | null;
  sourceId: string;
  sourcePath: string;
  sourceUrl: string;
  contentHash: string;
  acl: Record<string, unknown> | null;
};

@Table({ tableName: 'instruction_doc' })
export class InstructionDocEntity extends Model<
  InstructionDocAttributes,
  CreateInstructionDocAttributes
> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.TEXT })
  declare title: string;

  @Column({ type: DataType.TEXT })
  declare body: string;

  @Column({ type: DataType.ARRAY(DataType.TEXT) })
  declare contextTags: string[];

  @Column({ type: DataType.STRING(16) })
  declare scope: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare owner: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare lastReviewed: Date | null;

  @Column({ type: DataType.TEXT })
  declare sourceId: string;

  @Column({ type: DataType.TEXT })
  declare sourcePath: string;

  @Column({ type: DataType.TEXT })
  declare sourceUrl: string;

  @Column({ type: DataType.TEXT })
  declare contentHash: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare acl: Record<string, unknown> | null;
}
