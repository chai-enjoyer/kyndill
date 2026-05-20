import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as analyticsService from '../services/analyticsService';

const router = Router();

const eventSchema = z.object({
  event_type: z.string().trim().min(1).max(80),
  properties: z.record(z.unknown()).optional(),
  client_ts: z.string().max(40).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

router.post(
  '/events',
  validate(batchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await analyticsService.recordEvents(req.userId!, req.body.events);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as analyticsRouter };
