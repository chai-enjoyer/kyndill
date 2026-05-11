import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const stub = (_req: Request, res: Response) =>
  res.status(501).json({ error: 'Not implemented' })

// GET    /api/shop              list all purchasable items
router.get('/', stub)

// POST   /api/shop/buy          purchase an item (deduct coins, add to inventory)
router.post('/buy', stub)

// GET    /api/shop/inventory    get the user's inventory
router.get('/inventory', stub)

// POST   /api/shop/equip        equip a cosmetic to a slot
router.post('/equip', stub)

// DELETE /api/shop/equip/:slot  unequip the cosmetic in a slot
router.delete('/equip/:slot', stub)

export { router as shopRouter }
