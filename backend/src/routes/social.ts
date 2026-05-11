import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// ─── Friends ─────────────────────────────────────────────────────────────────

// GET    /api/social/friends                  list friends
router.get('/friends', stub)

// GET    /api/social/friends/requests         list incoming pending requests
// Must come before /friends/:friendId to avoid treating 'requests' as an id
router.get('/friends/requests', stub)

// POST   /api/social/friends/requests         send a friend request
router.post('/friends/requests', stub)

// PATCH  /api/social/friends/requests/:id     accept or reject a request
router.patch('/friends/requests/:id', stub)

// DELETE /api/social/friends/:friendId        remove a friend
router.delete('/friends/:friendId', stub)

// ─── Gifts ───────────────────────────────────────────────────────────────────

// GET    /api/social/gifts                    list pending gifts in inbox
router.get('/gifts', stub)

// POST   /api/social/gifts                    send a gift to a friend
router.post('/gifts', stub)

// PATCH  /api/social/gifts/:id/accept         accept a gift
router.patch('/gifts/:id/accept', stub)

// PATCH  /api/social/gifts/:id/decline        decline a gift
router.patch('/gifts/:id/decline', stub)

// ─── Search ──────────────────────────────────────────────────────────────────

// GET    /api/social/search?q=username        search public users by username
router.get('/search', stub)

export { router as socialRouter }
