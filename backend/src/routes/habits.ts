import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// GET    /api/habits              list active habits
router.get('/', stub)

// POST   /api/habits              create a habit
router.post('/', stub)

// PATCH  /api/habits/reorder      update sort_order for multiple habits
// Must be declared before /:id to avoid treating 'reorder' as an id
router.patch('/reorder', stub)

// GET    /api/habits/:id          get a single habit
router.get('/:id', stub)

// PATCH  /api/habits/:id          update a habit
router.patch('/:id', stub)

// DELETE /api/habits/:id          archive a habit (soft delete)
router.delete('/:id', stub)

// POST   /api/habits/:id/complete mark habit done for today
router.post('/:id/complete', stub)

// DELETE /api/habits/:id/complete undo today's completion
router.delete('/:id/complete', stub)

export { router as habitsRouter }
