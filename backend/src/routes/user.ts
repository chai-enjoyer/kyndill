import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/profile', notImplemented);
router.patch('/profile', notImplemented);

// Catch-all by username; must remain last so /profile resolves first.
router.get('/:username', notImplemented);

export { router as userRouter };
