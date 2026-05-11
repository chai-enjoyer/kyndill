import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? undefined,
  host:     process.env.DATABASE_URL ? undefined : (process.env.DB_HOST ?? 'localhost'),
  port:     process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT ?? 5432),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME ?? 'kyndill'),
  user:     process.env.DATABASE_URL ? undefined : (process.env.DB_USER ?? 'postgres'),
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  max:                     10,
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis:  2_000,
})

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err)
  process.exit(1)
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values)
}
