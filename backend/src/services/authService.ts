import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'
import type { RegisterInput, LoginInput, JwtPayload } from '../types'

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12)

// Signs a JWT with 7-day expiry and HS256 algorithm.
// This is the one auth function that is fully implemented —
// it is called by register, login, and google auth.
export function signToken(userId: string): string {
  return jwt.sign(
    { userId } satisfies Pick<JwtPayload, 'userId'>,
    process.env.JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '7d' },
  )
}

// TODO: validate uniqueness, hash password, insert user, return token + profile
export async function register(_input: RegisterInput): Promise<{ token: string; userId: string }> {
  throw new AppError(501, 'Not implemented')
}

// TODO: lookup user by email, verify bcrypt hash, return token + profile
export async function login(_input: LoginInput): Promise<{ token: string; userId: string }> {
  throw new AppError(501, 'Not implemented')
}

// TODO: verify Google ID token, upsert user, return token + profile
export async function loginWithGoogle(_idToken: string): Promise<{ token: string; userId: string }> {
  throw new AppError(501, 'Not implemented')
}

// TODO: return full user profile for /auth/me
export async function getMe(_userId: string): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// Exported to suppress unused-import warnings; used in future implementation.
export { query, bcrypt, BCRYPT_ROUNDS }
