import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireRole } from '../middleware/rbac';
import { prisma } from '../db/client';

const router = Router();

router.get('/', requireRole(Role.supervisor), async (_req, res) => {
  const templates = await prisma.roundTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(templates);
});

router.post('/', requireRole(Role.supervisor), async (req, res) => {
  const schema = z.object({ name: z.string(), schedule: z.string(), assetIds: z.array(z.string()) });
  const body = schema.parse(req.body);
  const template = await prisma.roundTemplate.create({ data: { name: body.name, schedule: body.schedule, assetIds: JSON.stringify(body.assetIds) } });
  res.status(201).json(template);
});

export default router;
