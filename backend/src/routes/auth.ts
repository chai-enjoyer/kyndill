import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.post('/register', notImplemented);
router.post('/login', notImplemented);
router.post('/google', notImplemented);

router.post('/logout', requireAuth, notImplemented);
router.get('/me', requireAuth, notImplemented);

export { router as authRouter };
