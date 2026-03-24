import { Sequelize } from "sequelize-typescript";
import {MemoryEntity} from "./table/memory.entity.js";
import {MemoryRelationEntity} from "./table/memory-relation.entity.js";
import {TagEntity} from "./table/tag.entity.js";
import {MemoryTagEntity} from "./table/memory-tag.entity.js";

export const sequelizeClient = new Sequelize({
    dialect: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: "postgres",
    database: "memaro",
    models: [MemoryEntity, MemoryRelationEntity, MemoryTagEntity, TagEntity],
    logging: false,
});
