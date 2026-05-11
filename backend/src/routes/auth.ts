import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// ─── Public ─────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', stub)

// POST /api/auth/login
router.post('/login', stub)

// POST /api/auth/google  (Google ID token exchange)
router.post('/google', stub)

// ─── Protected ──────────────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', authenticate, stub)

// POST /api/auth/logout
router.post('/logout', authenticate, stub)

export { router as authRouter }
