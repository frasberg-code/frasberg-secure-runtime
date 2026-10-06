import type { HttpRequest, HttpResponse, NextFunction } from './http';
import { sendError } from './http';
import { hasPermission } from './api-key-permissions';

export function requirePermission(permission: string) {
  return (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
    const granted: string[] = req.apiKey?.permissions ?? [];
    if (!hasPermission(granted, permission)) {
      return sendError(req, res, 'PERMISSION_DENIED', 'Permission denied.', {
        required: permission,
      });
    }
    return next();
  };
}
