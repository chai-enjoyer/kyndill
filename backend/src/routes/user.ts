import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/profile', notImplemented);
router.patch('/profile', notImplemented);

router.get('/notifications', notImplemented);
router.patch('/notifications/:id/read', notImplemented);
router.post('/notifications/read-all', notImplemented);

// Catch-all by username; must remain last so /profile and /notifications resolve first.
router.get('/:username', notImplemented);

export { router as userRouter };
