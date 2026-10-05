// Authentication and Authorization Middleware
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  tenantId?: string;
  userId?: string;
  token?: string;
  role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      tenantId: string;
      userId: string;
      role: string;
    };
    req.tenantId = decoded.tenantId;
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Missing tenant ID' });
  }
  next();
}

export function generateToken(tenantId: string, userId: string, role: string = 'admin'): string {
  return jwt.sign({ tenantId, userId, role }, JWT_SECRET, { expiresIn: '24h' });
}
