module.exports = {
    dialect: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'memaro',
};
