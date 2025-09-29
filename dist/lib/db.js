"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDbConnection = initializeDbConnection;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
let pool = null;
dotenv_1.default.config();
async function initializeDbConnection() {
    if (pool) {
        return pool;
    }
    const rawPassword = process.env.PGPASSWORD;
    const config = {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: rawPassword === undefined || rawPassword === null ? undefined : String(rawPassword),
        database: process.env.PGDATABASE || 'postgres',
        max: Number(process.env.PGPOOL_MAX || 10),
        idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
        connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };
    pool = new pg_1.Pool(config);
    return pool;
}
const db = {
    query: async (text, params) => {
        if (!pool) {
            pool = await initializeDbConnection();
        }
        return pool.query(text, params);
    },
    close: async () => {
        if (pool) {
            try {
                await pool.end();
                console.log('Database pool closed');
            }
            catch (err) {
                console.error('Error closing database pool:', err);
            }
            finally {
                pool = null;
            }
        }
    },
};
exports.default = db;
