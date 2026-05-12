import { Router, type Request, type Response, type NextFunction } from 'express';
import * as notificationsService from '../services/notificationsService';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationsService.listUnread(req.userId!);
    res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.put('/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markAllRead(req.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export { router as notificationsRouter };
