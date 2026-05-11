import { Router, type Request, type Response, type NextFunction } from 'express';
import * as inventoryService from '../services/inventoryService';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await inventoryService.listForUser(req.userId!);
    res.status(200).json(inventory);
  } catch (err) {
    next(err);
  }
});

export { router as inventoryRouter };
