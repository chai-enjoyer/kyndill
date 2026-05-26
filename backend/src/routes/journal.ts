import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as journalService from '../services/journalService';

const router = Router();

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).optional(),
  before: z.string().datetime().optional(),
});

const deleteParamsSchema = z.object({
  source: z.enum(['feedback', 'mood_ping']),
  id: z.string().uuid(),
});

router.get('/entries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listSchema.parse(req.query);
    const entries = await journalService.listEntries(req.userId!, query);
    res.status(200).json({ entries });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/entries/:source/:id',
  validate(deleteParamsSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await journalService.deleteEntry(
        req.userId!,
        req.params.source as journalService.JournalEntrySource,
        req.params.id,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as journalRouter };
