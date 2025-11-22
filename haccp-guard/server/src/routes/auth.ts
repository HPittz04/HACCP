import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { prisma } from '../db/client';
import { issueToken, setSession, clearSession } from '../middleware/auth';

const router = Router();

router.post('/pin', async (req, res) => {
  const schema = z.object({ username: z.string(), pin: z.string().min(4) });
  const body = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !user.pinHash) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await argon2.verify(user.pinHash, body.pin);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
  const token = issueToken(user);
  setSession(res, token);
  return res.json({ user: { id: user.id, username: user.username, role: user.role }, token });
});

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
