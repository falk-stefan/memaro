import { Sequelize } from "sequelize-typescript";
import {MemoryEntity} from "./table/memory.entity.js";
import {MemoryRelationEntity} from "./table/memory-relation.entity.js";
import {TagEntity} from "./table/tag.entity.js";
import {MemoryTagEntity} from "./table/memory-tag.entity.js";
import {InstructionDocEntity} from "./table/instruction-doc.entity.js";

export const sequelizeClient = new Sequelize({
    dialect: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
    username: "postgres",
    password: "postgres",
    database: "memaro",
    models: [MemoryEntity, MemoryRelationEntity, MemoryTagEntity, TagEntity, InstructionDocEntity],
    logging: false,
});
