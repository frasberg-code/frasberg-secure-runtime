import { buildErrorResponse } from './error-response';

export class FrasbergError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface Req {
  requestId?: string;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
}

export function errorMiddleware(
  error: unknown,
  req: Req,
  res: Res,
  _next: (err?: unknown) => void,
) {
  const requestId = req.requestId ?? 'unknown';
  if (error instanceof FrasbergError) {
    return res
      .status(error.status)
      .json(
        buildErrorResponse(requestId, error.code, error.message, error.details),
      );
  }
  return res
    .status(500)
    .json(
      buildErrorResponse(
        requestId,
        'INTERNAL_ERROR',
        'Unexpected internal error.',
      ),
    );
}
