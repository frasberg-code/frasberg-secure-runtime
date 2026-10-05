// Global Error Handler Middleware
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
}
