import { Router, type NextFunction, type Request, type Response } from 'express';
import * as progressService from '../services/progressService';

const router = Router();

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await progressService.getSummary(req.userId!);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
});

export { router as progressRouter };
