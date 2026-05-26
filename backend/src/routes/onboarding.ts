import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as onboardingService from '../services/onboardingService';

const router = Router();

// Habit-pick answers are required (these drive the recommender). The
// demographic block is fully optional — every field includes a
// "prefer_not_say" value so a user who skips never produces null rows that
// the research portal has to disambiguate from "didn't see this question".
const quizSchema = z.object({
  intents: z.array(z.enum(['body', 'mind', 'heart', 'space', 'creative'])).min(1).max(5),
  pace: z.enum(['packed', 'mixed', 'spacious']),
  times: z.array(z.enum(['morning', 'midday', 'evening', 'flexible', 'weekend'])).min(1).max(5),
  energy: z.enum(['low', 'steady', 'building']),
  blocker: z.enum(['forgetting', 'energy', 'time', 'all-or-nothing']),
  age_band: z
    .enum(['under_18', '18_24', '25_34', '35_44', '45_54', '55_64', '65_plus', 'prefer_not_say'])
    .optional(),
  occupation: z
    .enum([
      'student',
      'employed_full',
      'employed_part',
      'self_employed',
      'unemployed',
      'retired',
      'caregiver',
      'other',
      'prefer_not_say',
    ])
    .optional(),
  student_level: z
    .enum(['high_school', 'undergrad', 'postgrad', 'not_student', 'prefer_not_say'])
    .optional(),
  region: z
    .enum([
      'na',
      'sa',
      'eu',
      'mena',
      'ssa',
      'sa_asia',
      'ea_asia',
      'se_asia',
      'oceania',
      'prefer_not_say',
    ])
    .optional(),
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
