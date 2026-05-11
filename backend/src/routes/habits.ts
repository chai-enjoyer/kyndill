import { Router } from 'express';
import { notImplemented } from '../middleware/errorHandler';

const router = Router();

router.get('/', notImplemented);
router.post('/', notImplemented);
router.get('/:id', notImplemented);
router.patch('/:id', notImplemented);
router.delete('/:id', notImplemented);

router.post('/:id/complete', notImplemented);
router.get('/:id/completions', notImplemented);

export { router as habitsRouter };
