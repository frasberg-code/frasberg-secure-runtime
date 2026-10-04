import type { RouterMiddleware } from './types';

export const propagateContinuity: RouterMiddleware = ({
  request,
  headers,
}) => {
  const continuityId = request.headers['x-continuity-id'];
  if (continuityId === undefined) {
    return;
  }
  if (
    typeof continuityId !== 'string' ||
    !continuityId.trim() ||
    continuityId.length > 256
  ) {
    throw new Error('Invalid continuity identifier.');
  }
  headers.set('x-continuity-id', continuityId.trim());
};
