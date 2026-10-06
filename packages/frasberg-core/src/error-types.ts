export interface ErrorPayload {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
