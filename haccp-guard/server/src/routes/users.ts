import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { prisma } from '../db/client';
import { Role } from '@prisma/client';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', requireRole(Role.admin), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

router.post('/', requireRole(Role.admin), async (req, res) => {
  const schema = z.object({ username: z.string(), pin: z.string().min(4), role: z.nativeEnum(Role) });
  const body = schema.parse(req.body);
  const pinHash = await argon2.hash(body.pin);
  const user = await prisma.user.create({ data: { username: body.username, pinHash, role: body.role } });
  res.status(201).json(user);
});

export default router;
