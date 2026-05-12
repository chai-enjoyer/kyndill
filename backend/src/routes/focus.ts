import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as focusService from '../services/focusService';

const router = Router();

const completeSchema = z.object({
  duration_minutes: z.number().int().min(1).max(120),
  rating: z.number().int().min(1).max(5).optional(),
});
const ratingSchema = z.object({ rating: z.number().int().min(1).max(5) });
const idParam = z.object({ id: z.string().uuid() });

router.post(
  '/complete',
  validate(completeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await focusService.complete(
        req.userId!,
        req.body.duration_minutes,
        req.body.rating,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await focusService.getStats(req.userId!);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/rating',
  validate(idParam, 'params'),
  validate(ratingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await focusService.rateSession(req.userId!, req.params.id, req.body.rating);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as focusRouter };
