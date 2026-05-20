import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../../src/db/pool';

// Usage:
//   npm run admin:create -- email@example.com supersecret "Display Name"
//
// Creates or updates a research_admins row. Idempotent: re-running with the
// same email rotates the password and reactivates the account.

async function main() {
  const [, , emailRaw, password, displayName] = process.argv;
  if (!emailRaw || !password) {
    console.error('Usage: npm run admin:create -- <email> <password> [display name]');
    process.exitCode = 1;
    return;
  }
  const email = emailRaw.trim().toLowerCase();
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exitCode = 1;
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO research_admins (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   display_name  = COALESCE(EXCLUDED.display_name, research_admins.display_name),
                   is_active     = TRUE
     RETURNING id`,
    [email, hash, displayName?.trim() || null],
  );
  console.log(`admin ready: id=${rows[0]?.id} email=${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
