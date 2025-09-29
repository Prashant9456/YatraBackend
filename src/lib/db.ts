import { Pool, PoolConfig, QueryResult } from 'pg';
import dotenv from "dotenv";

let pool: Pool | null = null;
dotenv.config();

export async function initializeDbConnection(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const rawPassword = process.env.PGPASSWORD;
  const config: PoolConfig = {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: rawPassword === undefined || rawPassword === null ? undefined : String(rawPassword),
    database: process.env.PGDATABASE || 'postgres',
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  } as PoolConfig;

  pool = new Pool(config);
  return pool;
}

const db = {
  query: async <T = any>(text: string, params?: any[]): Promise<any> => {
    if (!pool) {
      pool = await initializeDbConnection();
    }
    return (pool as Pool).query<any>(text, params);
  },
  close: async (): Promise<void> => {
    if (pool) {
      try {
        await pool.end();
        console.log('Database pool closed');
      } catch (err) {
        console.error('Error closing database pool:', err);
      } finally {
        pool = null;
      }
    }
  },
};

export default db;


