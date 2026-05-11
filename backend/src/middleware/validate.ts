import type { Request, Response, NextFunction } from 'express'
import { type ZodSchema, ZodError } from 'zod'

// Validates req.body against a Zod schema.
// On success, replaces req.body with the parsed (coerced) value.
// On failure, returns 400 with field-level error details.
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path:    issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }

    req.body = result.data
    next()
  }
}

// Validates req.query against a Zod schema.
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path:    issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }

    req.query = result.data as typeof req.query
    next()
  }
}
