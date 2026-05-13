import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as recoveryService from '../services/recoveryService';

const router = Router();

const reflectionSchema = z.object({
  missed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  habit_id: z.string().uuid().optional(),
  mood: z.string().trim().max(40).optional(),
  note: z.string().trim().max(1000).optional(),
  skipped: z.boolean().optional(),
});

router.get('/prompt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await recoveryService.getPrompt(req.userId!);
    res.status(200).json({ prompt });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/reflection',
  validate(reflectionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await recoveryService.saveReflection(req.userId!, req.body);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export { router as recoveryRouter };
