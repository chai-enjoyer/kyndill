import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as onboardingService from '../services/onboardingService';

const router = Router();

const quizSchema = z.object({
  intents: z.array(z.enum(['body', 'mind', 'heart', 'space', 'creative'])).min(1).max(5),
  pace: z.enum(['packed', 'mixed', 'spacious']),
  times: z.array(z.enum(['morning', 'midday', 'evening', 'flexible', 'weekend'])).min(1).max(5),
  energy: z.enum(['low', 'steady', 'building']),
  blocker: z.enum(['forgetting', 'energy', 'time', 'all-or-nothing']),
});

router.post(
  '/quiz',
  validate(quizSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await onboardingService.saveQuiz(req.userId!, req.body);
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export { router as onboardingRouter };
