import { Router } from 'express';
import { z } from 'zod';
import { hmacValidator } from '../middleware/hmac';
import { createMeasurement } from '../services/measurements';
import { prisma } from '../db/client';

const router = Router();

const itemSchema = z.object({
  type: z.literal('measurement'),
  id_local: z.string(),
  ts: z.string(),
  payload: z.object({
    asset_id: z.string(),
    user_id: z.string().optional(),
    round_id: z.string().optional(),
    value_c: z.number(),
    stable: z.boolean().optional(),
    in_limit: z.boolean().optional(),
    limit_min_c: z.number().optional(),
    limit_max_c: z.number().optional(),
    device_id: z.string(),
    taken_at: z.string(),
    notes: z.string().nullish(),
    corrective: z
      .object({
        actionType: z.string(),
        comment: z.string().nullish(),
        performedById: z.string().optional()
      })
      .optional()
  })
});

router.post('/batch', hmacValidator, async (req, res) => {
  const schema = z.object({ device_id: z.string(), items: z.array(itemSchema) });
  const body = schema.parse(req.body);

  const results: any[] = [];
  for (const item of body.items) {
    if (item.type !== 'measurement') continue;
    const measurementId = `${body.device_id}-${item.id_local}`;
    const existing = await prisma.measurement.findUnique({ where: { id: measurementId } });
    if (existing) {
      results.push({ local: item.id_local, ok: true, id: existing.id });
      continue;
    }
    try {
      const result = await createMeasurement({
        id: measurementId,
        assetId: item.payload.asset_id,
        userId: item.payload.user_id,
        roundId: item.payload.round_id,
        valueC: item.payload.value_c,
        stable: item.payload.stable,
        inLimit: item.payload.in_limit,
        limitMinC: item.payload.limit_min_c,
        limitMaxC: item.payload.limit_max_c,
        notes: item.payload.notes,
        deviceId: item.payload.device_id,
        takenAt: new Date(item.payload.taken_at),
        corrective: item.payload.corrective
      });
      results.push({ local: item.id_local, ok: true, id: result.measurement.id });
    } catch (e: any) {
      results.push({ local: item.id_local, ok: false, error: e.message });
    }
  }

  res.json({ results });
});

export default router;
