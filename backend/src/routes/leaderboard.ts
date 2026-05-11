import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// GET /api/leaderboard           global leaderboard (public users, sorted by streak/xp)
// Query params: ?sort=streak|xp&limit=25
router.get('/', stub)

// GET /api/leaderboard/friends   friends-only leaderboard
router.get('/friends', stub)

export { router as leaderboardRouter }
