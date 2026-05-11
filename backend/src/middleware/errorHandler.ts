import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}

export function notImplemented(req: Request, res: Response): void {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: `${req.method} ${req.baseUrl}${req.path} is not yet implemented`,
    },
  });
}
