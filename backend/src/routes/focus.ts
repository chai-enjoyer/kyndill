import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.post('/sessions', notImplemented);
router.get('/sessions', notImplemented);
router.get('/stats', notImplemented);

export { router as focusRouter };
