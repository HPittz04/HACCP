import { Router } from 'express';
import { z } from 'zod';
import { AssetType } from '@prisma/client';
import { listAssets, createAsset, updateAsset } from '../services/assets';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', async (req, res) => {
  const schema = z.object({ q: z.string().optional(), type: z.nativeEnum(AssetType).optional(), active: z.string().optional() });
  const query = schema.parse(req.query);
  const assets = await listAssets({ q: query.q, type: query.type, active: query.active ? query.active === 'true' : undefined });
  res.json(assets);
});

router.post('/', requireRole(Role.supervisor), async (req, res) => {
  const schema = z.object({
    name: z.string(),
    type: z.nativeEnum(AssetType),
    location: z.string().optional(),
    code: z.string().optional(),
    limitMinC: z.number().optional(),
    limitMaxC: z.number().optional(),
    notes: z.string().optional()
  });
  const body = schema.parse(req.body);
  const asset = await createAsset(body);
  res.status(201).json(asset);
});

router.put('/:id', requireRole(Role.supervisor), async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    type: z.nativeEnum(AssetType).optional(),
    location: z.string().optional(),
    code: z.string().optional(),
    limitMinC: z.number().optional(),
    limitMaxC: z.number().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional()
  });
  const body = schema.parse(req.body);
  const asset = await updateAsset(req.params.id, body);
  res.json(asset);
});

export default router;
