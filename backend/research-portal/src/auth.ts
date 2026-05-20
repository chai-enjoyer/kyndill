import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../../src/db/pool';

declare module 'express-serve-static-core' {
  interface Request {
    adminId?: string;
    adminEmail?: string;
  }
}

// Distinct secret from the main app's JWT_SECRET. If unset we refuse to
// start so the portal can't run with a guessable signature.
const SECRET = process.env.RESEARCH_JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error(
    'RESEARCH_JWT_SECRET must be set in the environment and at least 32 characters. ' +
      'This MUST differ from the main app JWT_SECRET.',
  );
}

const TOKEN_TTL = '8h'; // short session so a leaked token has a tight window

export interface AdminTokenPayload {
  sub: string;
  email: string;
}

export function signAdminToken(adminId: string, email: string): string {
  return jwt.sign({ sub: adminId, email }, SECRET as string, {
    expiresIn: TOKEN_TTL,
    issuer: 'kyndill-research',
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Missing bearer token.' } });
    return;
  }
  try {
    const payload = jwt.verify(match[1], SECRET as string, {
      issuer: 'kyndill-research',
    }) as AdminTokenPayload;
    req.adminId = payload.sub;
    req.adminEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: { code: 'BAD_TOKEN', message: 'Invalid or expired token.' } });
  }
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; display_name: string | null } | null> {
  const { rows } = await pool.query<{
    id: string;
    email: string;
    display_name: string | null;
    password_hash: string;
    is_active: boolean;
  }>(
    `SELECT id, email, display_name, password_hash, is_active
       FROM research_admins
      WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  const row = rows[0];
  if (!row || !row.is_active) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  await pool.query(`UPDATE research_admins SET last_login_at = NOW() WHERE id = $1`, [row.id]);
  return { id: row.id, email: row.email, display_name: row.display_name };
}
