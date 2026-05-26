import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as wishlistService from '../services/wishlistService';

const router = Router();

const setSchema = z.object({
  item_ids: z.array(z.string().uuid()).max(3),
});

const friendIdSchema = z.object({ id: z.string().uuid() });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlist = await wishlistService.getOwn(req.userId!);
    res.status(200).json({ wishlist });
  } catch (err) {
    next(err);
  }
});

router.put('/', validate(setSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlist = await wishlistService.set(req.userId!, req.body.item_ids);
    res.status(200).json({ wishlist });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/friend/:id',
  validate(friendIdSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wishlist = await wishlistService.getForFriend(req.userId!, req.params.id);
      res.status(200).json({ wishlist });
    } catch (err) {
      next(err);
    }
  },
);

export { router as wishlistRouter };
