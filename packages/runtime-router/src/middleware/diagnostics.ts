import type { RouterMiddleware } from './types';

export const propagateDiagnostics: RouterMiddleware = ({
  request,
  headers,
}) => {
  headers.set('x-request-id', request.id);
};
