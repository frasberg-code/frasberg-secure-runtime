import { z, ZodSchema } from "zod";
import { ValidationError } from "./errors";

export function validateInput<T>(
  schema: ZodSchema,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors;
    const firstError = errors[0];
    throw new ValidationError(
      firstError.message,
      firstError.path.join(".")
    );
  }
  return result.data as T;
}

export function createValidator<T>(schema: ZodSchema) {
  return (data: unknown): T => validateInput<T>(schema, data);
}

// Common validation schemas
export const IdSchema = z.string().uuid();
export const PageSchema = z.number().int().positive().default(1);
export const LimitSchema = z.number().int().positive().max(100).default(20);
export const PaginationSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
});

export type Pagination = z.infer<typeof PaginationSchema>;

export function getPaginationParams(
  page?: unknown,
  limit?: unknown
): Pagination {
  return validateInput(PaginationSchema, { page, limit });
}
