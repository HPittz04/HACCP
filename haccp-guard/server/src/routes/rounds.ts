import { Router } from 'express';
import { z } from 'zod';
import { Role, RoundStatus } from '@prisma/client';
import { requireRole } from '../middleware/rbac';
import { generateRoundsForDate, listRounds, markRound } from '../services/rounds';

const router = Router();

router.post('/generate', requireRole(Role.supervisor), async (req, res) => {
  const schema = z.object({ date: z.string() });
  const body = schema.parse(req.body);
  const created = await generateRoundsForDate(body.date);
  res.json({ created });
});

router.get('/', async (req, res) => {
  const schema = z.object({ date: z.string().optional(), status: z.nativeEnum(RoundStatus).optional(), assigned_to: z.string().optional() });
  const query = schema.parse(req.query);
  const rounds = await listRounds(query);
  res.json(rounds);
});

router.post('/:id/start', async (req, res) => {
  const round = await markRound(req.params.id, RoundStatus.in_progress);
  res.json(round);
});

router.post('/:id/done', async (req, res) => {
  const round = await markRound(req.params.id, RoundStatus.done);
  res.json(round);
});

export default router;
