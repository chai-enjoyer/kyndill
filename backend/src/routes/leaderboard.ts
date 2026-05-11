import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/friends', notImplemented);
router.get('/weekly', notImplemented);

export { router as leaderboardRouter };
