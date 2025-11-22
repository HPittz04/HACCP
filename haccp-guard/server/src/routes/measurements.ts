import { Router } from 'express';
import { z } from 'zod';
import { createMeasurement } from '../services/measurements';

const router = Router();

router.post('/', async (req, res) => {
  const schema = z.object({
    round_id: z.string().optional(),
    asset_id: z.string(),
    user_id: z.string().optional(),
    value_c: z.number(),
    stable: z.boolean().optional(),
    in_limit: z.boolean().optional(),
    limit_min_c: z.number().optional(),
    limit_max_c: z.number().optional(),
    notes: z.string().nullish(),
    device_id: z.string().optional(),
    taken_at: z.string(),
    corrective: z
      .object({
        actionType: z.string(),
        comment: z.string().nullish(),
        performedById: z.string().optional()
      })
      .optional()
  });
  const body = schema.parse(req.body);
  try {
    const result = await createMeasurement({
      assetId: body.asset_id,
      roundId: body.round_id,
      userId: body.user_id,
      valueC: body.value_c,
      stable: body.stable,
      inLimit: body.in_limit,
      limitMinC: body.limit_min_c,
      limitMaxC: body.limit_max_c,
      notes: body.notes,
      deviceId: body.device_id,
      takenAt: new Date(body.taken_at),
      corrective: body.corrective ? { actionType: body.corrective.actionType, comment: body.corrective.comment, performedById: body.corrective.performedById } : undefined
    });
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
