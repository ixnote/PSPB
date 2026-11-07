import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/pspba';
export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
});
