import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// ─── Own profile ─────────────────────────────────────────────────────────────

// GET   /api/user/profile               get own full profile
router.get('/profile', stub)

// PATCH /api/user/profile               update display_name, bio, avatar_url
router.patch('/profile', stub)

// PATCH /api/user/password              change password (requires current password)
router.patch('/password', stub)

// PATCH /api/user/visibility            update profile visibility setting
router.patch('/visibility', stub)

// ─── Notifications ────────────────────────────────────────────────────────────
// Declared before /:username to prevent 'notifications' being treated as a username.

// GET   /api/user/notifications         list notifications (newest first)
router.get('/notifications', stub)

// PATCH /api/user/notifications/read-all  mark all notifications read
// Must come before /notifications/:id/read to avoid 'read-all' matching as an id
router.patch('/notifications/read-all', stub)

// PATCH /api/user/notifications/:id/read  mark a single notification read
router.patch('/notifications/:id/read', stub)

// ─── Public profile ───────────────────────────────────────────────────────────
// /:username must be last; it matches anything not caught above.

// GET   /api/user/:username             get a public profile by username
router.get('/:username', stub)

export { router as userRouter }
