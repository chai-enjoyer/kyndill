import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as feedbackService from '../services/feedbackService';

const router = Router();

const createSchema = z.object({
  habit_id: z.string().uuid().optional(),
  context: z.string().trim().min(1).max(60),
  mood: z.string().trim().max(40).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().trim().max(1000).optional(),
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await feedbackService.create(req.userId!, req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as feedbackRouter };
