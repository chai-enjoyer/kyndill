import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request payload is invalid',
          issues: result.error.issues,
        },
      });
      return;
    }
    Object.assign(req, { [source]: result.data });
    next();
  };
}
