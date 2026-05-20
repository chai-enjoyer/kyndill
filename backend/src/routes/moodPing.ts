import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as moodPingService from '../services/moodPingService';

const router = Router();

const submitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await moodPingService.getStatus(req.userId!);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validate(submitSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await moodPingService.submit(req.userId!, req.body);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export { router as moodPingRouter };
