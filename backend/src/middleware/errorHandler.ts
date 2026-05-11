import type { Request, Response, NextFunction } from 'express'

// Throw this anywhere in route handlers or services to return a specific HTTP status.
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 4-argument signature is required for Express to recognize this as an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  // Log unexpected errors; don't expose internals to the client.
  console.error('[unhandled error]', err)
  res.status(500).json({ error: 'Internal server error' })
}
