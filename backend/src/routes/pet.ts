import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/', notImplemented);
router.patch('/', notImplemented);
router.post('/consume', notImplemented);

export { router as petRouter };
