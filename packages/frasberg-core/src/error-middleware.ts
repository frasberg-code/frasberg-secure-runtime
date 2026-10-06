import { ErrorCode } from './error-codes';
import { buildErrorResponse } from './error-response';
import { generateRequestId, isValidRequestId } from './request-id';

export class FrasbergError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
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
  const requestId = isValidRequestId(req.requestId)
    ? req.requestId
    : generateRequestId();
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
        ErrorCode.INTERNAL_ERROR,
        'Unexpected internal error.',
      ),
    );
}
