import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as shopService from '../services/shopService';

const router = Router();

const purchaseSchema = z.object({ item_id: z.string().uuid() });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await shopService.listShop(req.userId!);
    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/purchase',
  validate(purchaseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await shopService.purchaseItem(req.userId!, req.body.item_id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/buy-streak-freeze',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await shopService.buyStreakFreeze(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as shopRouter };
