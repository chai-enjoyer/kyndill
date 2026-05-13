import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as authService from '../services/authService';
import {
  getEmailValidationMessage,
  getPasswordValidationMessages,
  normalizeEmail,
} from '../lib/credentials';

const router = Router();

const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .superRefine((email, ctx) => {
    const message = getEmailValidationMessage(email);
    if (message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  });

const strongPasswordSchema = z.string().superRefine((password, ctx) => {
  for (const message of getPasswordValidationMessages(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
});

const registerSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    password_confirmation: z.string().min(1, 'Repeat your password'),
    display_name: z
      .string()
      .trim()
      .min(2, 'Display name must be at least 2 characters')
      .max(60, 'Display name must be at most 60 characters'),
  })
  .superRefine((input, ctx) => {
    if (input.password_confirmation !== input.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['password_confirmation'],
      });
    }
  });

const loginSchema = z.object({
  email: emailSchema,
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
