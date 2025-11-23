import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/client';

export async function hmacValidator(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header('X-Device-ID');
  const signature = req.header('X-Signature');
  if (!deviceId || !signature) return res.status(401).json({ error: 'missing device headers' });

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return res.status(401).json({ error: 'invalid device' });

  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', device.secret).update(body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  (req as any).device = device;
  return next();
}
