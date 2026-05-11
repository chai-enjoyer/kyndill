import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// GET   /api/pet          get the user's pet
router.get('/', stub)

// PATCH /api/pet          update pet name or species
router.patch('/', stub)

// POST  /api/pet/feed     use a consumable item from inventory on the pet
router.post('/feed', stub)

export { router as petRouter }
