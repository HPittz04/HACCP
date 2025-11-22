import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth';
import { Role } from '@prisma/client';

const hierarchy: Record<Role, number> = {
  operator: 1,
  supervisor: 2,
  admin: 3
};

export function requireRole(role: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (hierarchy[req.user.role] < hierarchy[role]) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
}
