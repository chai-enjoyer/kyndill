import { Pool, type PoolConfig } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.',
  );
}

const config: PoolConfig = {
  connectionString,
  max: Number(process.env.PGPOOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
};

export const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});
