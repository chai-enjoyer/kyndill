import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// GET  /api/focus/sessions    list the user's completed focus sessions
router.get('/sessions', stub)

// POST /api/focus/sessions    record a completed focus session
router.post('/sessions', stub)

export { router as focusRouter }
