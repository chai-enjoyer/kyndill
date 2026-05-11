import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.',
  );
}

const pool = new Pool({ connectionString });
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadApplied(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations',
  );
  return new Set(rows.map((r) => r.filename));
}

function discoverFiles(): string[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function applyOne(filename: string): Promise<void> {
  const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    console.log(`applied  ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`FAILED   ${filename}`);
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await loadApplied();
  const files = discoverFiles();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip     ${file}`);
      continue;
    }
    await applyOne(file);
    count += 1;
  }

  if (count === 0) {
    console.log('database is up to date');
  } else {
    console.log(`applied ${count} migration${count === 1 ? '' : 's'}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
