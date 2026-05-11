import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/items', notImplemented);
router.post('/purchase', notImplemented);
router.get('/inventory', notImplemented);
router.post('/equip', notImplemented);
router.post('/unequip', notImplemented);

export { router as shopRouter };
