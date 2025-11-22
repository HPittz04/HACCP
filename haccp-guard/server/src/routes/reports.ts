import { Router } from 'express';
import path from 'path';
import { z } from 'zod';
import { measurementsReport } from '../services/reports';
import { streamCsv } from '../utils/csv';
import { renderEjsToPdf } from '../utils/pdf';

const router = Router();

router.get('/csv', async (req, res) => {
  const schema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    asset_id: z.string().optional(),
    round_id: z.string().optional(),
    user_id: z.string().optional()
  });
  const query = schema.parse(req.query);
  const data = await measurementsReport(query);
  const rows = data.map((m) => ({
    id: m.id,
    asset: m.asset.name,
    valueC: m.valueC,
    takenAt: m.takenAt.toISOString(),
    inLimit: m.inLimit,
    user: m.user?.username || ''
  }));
  streamCsv(res, rows, 'report.csv');
});

router.get('/pdf', async (req, res) => {
  const schema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    round_id: z.string().optional()
  });
  const query = schema.parse(req.query);
  const data = await measurementsReport({ from: query.from, to: query.to, round_id: query.round_id });
  const buffer = await renderEjsToPdf(path.join(process.cwd(), 'src', 'views', 'reports', 'pdf.ejs'), { measurements: data });
  res.setHeader('Content-Type', 'application/pdf');
  res.send(buffer);
});

export default router;
