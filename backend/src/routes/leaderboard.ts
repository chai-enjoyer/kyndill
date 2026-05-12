import { Router, type Request, type Response, type NextFunction } from 'express';
import * as leaderboardService from '../services/leaderboardService';

const router = Router();

router.get('/friends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await leaderboardService.listFriendsLeaderboard(req.userId!);
    res.status(200).json({ entries });
  } catch (err) {
    next(err);
  }
});

router.get('/global', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await leaderboardService.listGlobalLeaderboard();
    res.status(200).json({ entries });
  } catch (err) {
    next(err);
  }
});

export { router as leaderboardRouter };
