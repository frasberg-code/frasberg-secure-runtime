// Input Validation Middleware
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Query validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Params validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  tier: z.enum(['basic', 'pro', 'enterprise', 'sovereign', 'ultra']),
  region: z.enum(['us-west', 'us-east', 'eu-central', 'apac', 'latam', 'middle-east', 'africa']),
  email: z.string().email('Invalid email'),
  tenantName: z.string().min(1).max(255),
};
