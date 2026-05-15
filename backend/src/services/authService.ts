import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';
import { normalizeEmail } from '../lib/credentials';
import type { JwtPayload } from '../types';

const BCRYPT_COST = 12;
const JWT_ALGORITHM = 'HS256' as const;
const JWT_EXPIRES_IN = '7d';
const STARTER_COINS = 20;

// ============================================================
// Pure utility functions (unit-testable; no DB, no network).
// ============================================================

export function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, requireJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
  }) as JwtPayload;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

// ============================================================
// DTOs
// ============================================================

export interface AuthUserDto {
  id: string;
  email: string;
  display_name: string;
  level: number;
  xp: number;
  coins: number;
}

export interface AuthResult {
  token: string;
  user: AuthUserDto;
}

export interface MeUserDto extends AuthUserDto {
  username: string;
  streak_current: number;
  streak_longest: number;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  research_consent: boolean;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  level: number;
  xp: number;
  coins: number;
}

interface OAuthUserRow extends UserRow {
  oauth_provider: string | null;
  oauth_id: string | null;
}

function toAuthUserDto(row: UserRow): AuthUserDto {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    level: row.level,
    xp: row.xp,
    coins: row.coins,
  };
}

// ============================================================
// Internal helpers
// ============================================================

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, level, xp, coins
       FROM users
      WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

function uniqueViolationConstraint(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  const e = err as { code?: string; constraint?: string };
  if (e.code !== '23505') return null;
  return e.constraint ?? null;
}

function deriveUsernameBase(email: string, fallback: string): string {
  const localPart = email.split('@')[0] ?? '';
  const candidate = localPart || fallback;
  const slug = candidate.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);
  return slug || 'user';
}

function shortRandom(): string {
  return crypto.randomBytes(3).toString('hex');
}

async function generateAvailableUsername(email: string, displayName: string): Promise<string> {
  const base = deriveUsernameBase(email, displayName);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${shortRandom()}`;
    const { rows } = await pool.query(
      'SELECT 1 FROM users WHERE username = $1',
      [candidate],
    );
    if (rows.length === 0) return candidate;
  }
  throw new HttpError(500, 'USERNAME_GENERATION_FAILED', 'Could not allocate a unique username');
}

async function ensureEmailDomainCanReceiveMail(email: string): Promise<void> {
  if (process.env.SKIP_EMAIL_DOMAIN_CHECK === 'true') return;

  const domain = email.split('@')[1];
  if (!domain) {
    throw new HttpError(400, 'INVALID_EMAIL_DOMAIN', 'Enter a valid email address');
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return;
  } catch {
    // Some valid domains accept mail at the bare A/AAAA record without MX.
  }

  try {
    const [ipv4, ipv6] = await Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]);
    if (
      (ipv4.status === 'fulfilled' && ipv4.value.length > 0) ||
      (ipv6.status === 'fulfilled' && ipv6.value.length > 0)
    ) {
      return;
    }
  } catch {
    // Promise.allSettled should not throw, but keep this deliberately defensive.
  }

  throw new HttpError(
    400,
    'EMAIL_DOMAIN_UNREACHABLE',
    'That email domain does not appear to receive mail',
  );
}

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  if (googleClient) return googleClient;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new HttpError(500, 'SERVER_MISCONFIGURED', 'GOOGLE_CLIENT_ID is not configured');
  }
  googleClient = new OAuth2Client(clientId);
  return googleClient;
}

// ============================================================
// Service methods
// ============================================================

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  await ensureEmailDomainCanReceiveMail(email);

  const passwordHash = await hashPassword(input.password);
  const username = await generateAvailableUsername(email, displayName);

  let newUserId: string;
  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, display_name, username, coins)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, passwordHash, displayName, username, STARTER_COINS],
    );
    newUserId = rows[0].id;
  } catch (err) {
    const constraint = uniqueViolationConstraint(err);
    if (constraint === 'users_email_key') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    if (constraint === 'users_username_key') {
      throw new HttpError(409, 'USERNAME_TAKEN', 'Username collision, please retry');
    }
    throw err;
  }

  // The AFTER INSERT trigger on users creates the pet and streaks rows.
  return {
    token: generateToken(newUserId),
    user: {
      id: newUserId,
      email,
      display_name: displayName,
      level: 1,
      xp: 0,
      coins: STARTER_COINS,
    },
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  const user = await findUserByEmail(email);
  if (!user || !user.password_hash) {
    // Unknown email OR OAuth-only account. Same response to avoid account enumeration.
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const ok = await comparePassword(input.password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return {
    token: generateToken(user.id),
    user: toAuthUserDto(user),
  };
}

export async function googleSignIn(credential: string): Promise<AuthResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new HttpError(500, 'SERVER_MISCONFIGURED', 'GOOGLE_CLIENT_ID is not configured');
  }

  const client = getGoogleClient();
  let payload: TokenPayload | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'Could not verify Google credential');
  }

  if (!payload || !payload.email || !payload.sub) {
    throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'Google credential is missing required claims');
  }

  const email = normalizeEmail(payload.email);
  const googleId = payload.sub;
  const emailVerified = payload.email_verified !== false;
  const name = (payload.name ?? email.split('@')[0] ?? 'user').trim();
  const picture = payload.picture ?? null;

  const { rows: existing } = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, level, xp, coins
       FROM users
      WHERE oauth_provider = 'google' AND oauth_id = $1`,
    [googleId],
  );

  if (existing.length > 0) {
    return {
      token: generateToken(existing[0].id),
      user: toAuthUserDto(existing[0]),
    };
  }

  const { rows: matchingEmail } = await pool.query<OAuthUserRow>(
    `SELECT id, email, password_hash, display_name, level, xp, coins, oauth_provider, oauth_id
       FROM users
      WHERE email = $1`,
    [email],
  );

  if (matchingEmail.length > 0) {
    const user = matchingEmail[0];
    if (user.oauth_id && user.oauth_id !== googleId) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'This email is linked to another Google account');
    }
    if (!emailVerified) {
      throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'Google email is not verified');
    }

    await pool.query(
      `UPDATE users
          SET oauth_provider = 'google',
              oauth_id = $2,
              avatar_url = COALESCE(avatar_url, $3)
        WHERE id = $1`,
      [user.id, googleId, picture],
    );

    return {
      token: generateToken(user.id),
      user: toAuthUserDto(user),
    };
  }

  if (!emailVerified) {
    throw new HttpError(401, 'INVALID_GOOGLE_TOKEN', 'Google email is not verified');
  }

  const username = await generateAvailableUsername(email, name);

  let newUserId: string;
  try {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO users
         (email, password_hash, display_name, username, avatar_url, oauth_provider, oauth_id, coins)
       VALUES ($1, NULL, $2, $3, $4, 'google', $5, $6)
       RETURNING id`,
      [email, name, username, picture, googleId, STARTER_COINS],
    );
    newUserId = rows[0].id;
  } catch (err) {
    const constraint = uniqueViolationConstraint(err);
    if (constraint === 'users_email_key') {
      throw new HttpError(
        409,
        'EMAIL_TAKEN',
        'A local-credentials account already uses this email; sign in with your password first',
      );
    }
    if (constraint === 'users_username_key') {
      throw new HttpError(409, 'USERNAME_TAKEN', 'Username collision, please retry');
    }
    if (constraint === 'users_oauth_unique') {
      // Concurrent google sign-in for the same sub raced us; pick up the winning row.
      const { rows } = await pool.query<UserRow>(
        `SELECT id, email, password_hash, display_name, level, xp, coins
           FROM users WHERE oauth_provider = 'google' AND oauth_id = $1`,
        [googleId],
      );
      if (rows.length > 0) {
        return { token: generateToken(rows[0].id), user: toAuthUserDto(rows[0]) };
      }
    }
    throw err;
  }

  return {
    token: generateToken(newUserId),
    user: {
      id: newUserId,
      email,
      display_name: name,
      level: 1,
      xp: 0,
      coins: STARTER_COINS,
    },
  };
}

export async function getCurrentUser(userId: string): Promise<MeUserDto> {
  const { rows } = await pool.query<MeUserDto>(
    `SELECT id, email, display_name, username, level, xp, coins,
            streak_current, streak_longest, avatar_url, visibility, research_consent
       FROM users
      WHERE id = $1`,
    [userId],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
  }
  return rows[0];
}
