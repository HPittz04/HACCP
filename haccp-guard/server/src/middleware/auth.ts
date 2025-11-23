import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { env } from '../config/env';
import { Role, User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const COOKIE_NAME = 'session_token';

export function issueToken(user: User) {
  return jwt.sign({ sub: user.id, role: user.role }, env.sessionSecret, { expiresIn: '1h' });
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.sessionSecret) as { sub: string; role: Role };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    res.clearCookie(COOKIE_NAME);
  }
  return next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}

export function setSession(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME);
}
