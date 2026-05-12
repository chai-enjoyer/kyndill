import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as habitService from '../services/habitService';

const router = Router();

const habitCategorySchema = z.enum(['Health', 'Productivity', 'Social', 'Learning', 'Wellness']);
const habitFrequencySchema = z.enum(['daily', 'weekly']);
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS');
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).max(7);

const createHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().max(500).nullable().optional(),
    category: habitCategorySchema,
    frequency: habitFrequencySchema,
    days_of_week: daysOfWeekSchema.optional(),
    completion_start_time: timeSchema.nullable().optional(),
    completion_end_time: timeSchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.frequency !== 'weekly' ||
      (Array.isArray(data.days_of_week) && data.days_of_week.length > 0),
    { message: 'days_of_week is required when frequency is weekly', path: ['days_of_week'] },
  );

const updateHabitSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  category: habitCategorySchema.optional(),
  frequency: habitFrequencySchema.optional(),
  days_of_week: daysOfWeekSchema.optional(),
  completion_start_time: timeSchema.nullable().optional(),
  completion_end_time: timeSchema.nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const reorderSchema = z
  .array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) }))
  .min(1);

const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scope = typeof req.query.scope === 'string' ? req.query.scope : 'today';
    const habits =
      scope === 'all'
        ? await habitService.listAll(req.userId!)
        : await habitService.listForToday(req.userId!);
    res.status(200).json({ habits });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  validate(createHabitSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habit = await habitService.create(req.userId!, req.body);
      res.status(201).json(habit);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/reorder',
  validate(reorderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await habitService.reorder(req.userId!, req.body);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateHabitSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const habit = await habitService.update(req.userId!, req.params.id, req.body);
      res.status(200).json(habit);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await habitService.archive(req.userId!, req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/complete',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await habitService.complete(req.userId!, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id/history',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const completions = await habitService.getHistory(req.userId!, req.params.id);
      res.status(200).json({ completions });
    } catch (err) {
      next(err);
    }
  },
);

export { router as habitsRouter };
