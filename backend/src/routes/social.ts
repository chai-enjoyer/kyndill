import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/friends', notImplemented);
router.delete('/friends/:user_id', notImplemented);

router.get('/friend-requests', notImplemented);
router.post('/friend-requests', notImplemented);
router.post('/friend-requests/:id/accept', notImplemented);
router.post('/friend-requests/:id/reject', notImplemented);

router.get('/gifts', notImplemented);
router.post('/gifts', notImplemented);
router.post('/gifts/:id/accept', notImplemented);
router.post('/gifts/:id/decline', notImplemented);

export { router as socialRouter };
