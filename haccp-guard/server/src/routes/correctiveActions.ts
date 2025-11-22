import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';

const router = Router();

router.post('/', async (req, res) => {
  const schema = z.object({ measurement_id: z.string(), action_type: z.string(), comment: z.string().optional(), performed_by: z.string().optional() });
  const body = schema.parse(req.body);
  const corrective = await prisma.correctiveAction.create({
    data: { measurementId: body.measurement_id, actionType: body.action_type, comment: body.comment, performedById: body.performed_by }
  });
  res.status(201).json(corrective);
});

export default router;
