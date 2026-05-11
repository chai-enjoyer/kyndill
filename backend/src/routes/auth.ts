import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as authService from '../services/authService';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(60, 'Display name must be at most 60 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register({
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.display_name,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/google',
  validate(googleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.googleSignIn(req.body.credential);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/logout', requireAuth, (_req: Request, res: Response) => {
  // Stateless JWT: the client discards its token. Endpoint exists for symmetry.
  res.status(204).end();
});

router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.userId!);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },
);

export { router as authRouter };
