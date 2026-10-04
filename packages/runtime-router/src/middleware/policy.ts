import type { RouterMiddleware } from './types';

export const propagatePolicy: RouterMiddleware = ({ request, headers }) => {
  for (const header of ['x-policy-id', 'x-policy-mode']) {
    const value = request.headers[header];
    if (value === undefined) {
      continue;
    }
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > 256
    ) {
      throw new Error(`Invalid ${header} header.`);
    }
    headers.set(header, value.trim());
  }
};
