import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as petService from '../services/petService';

const router = Router();

const itemIdSchema = z.object({ item_id: z.string().uuid() });
const slotSchema = z.object({ slot: z.enum(petService.EQUIP_SLOTS) });
const initializeSchema = z.object({
  species: z.enum(petService.PET_SPECIES),
  name: z.string().trim().min(1, 'Name is required').max(20, 'Name must be 20 characters or fewer'),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pet = await petService.getFullState(req.userId!);
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/initialize',
  validate(initializeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await petService.initialize(req.userId!, req.body.species, req.body.name);
      res.status(200).json(pet);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/feed',
  validate(itemIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await petService.feed(req.userId!, req.body.item_id);
      res.status(200).json(pet);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/equip',
  validate(itemIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipped = await petService.equip(req.userId!, req.body.item_id);
      res.status(200).json({ equipped });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/unequip',
  validate(slotSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await petService.unequip(req.userId!, req.body.slot);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as petRouter };
