import type { RouterMiddleware } from './types';

export const propagateIdentity: RouterMiddleware = ({ request, headers }) => {
  const ownerId = request.headers['x-owner-id'];
  const tenantId = request.headers['x-tenant-id'];

  if (
    ownerId !== undefined &&
    (typeof ownerId !== 'string' || !ownerId.trim() || ownerId.length > 256)
  ) {
    throw new Error('Invalid owner identity.');
  }
  if (
    tenantId !== undefined &&
    (typeof tenantId !== 'string' || !tenantId.trim() || tenantId.length > 256)
  ) {
    throw new Error('Invalid tenant identity.');
  }

  if (typeof ownerId === 'string') {
    headers.set('x-owner-id', ownerId.trim());
  }
  if (typeof tenantId === 'string') {
    headers.set('x-tenant-id', tenantId.trim());
  } else if (typeof ownerId === 'string') {
    headers.set('x-tenant-id', ownerId.trim());
  }
};
