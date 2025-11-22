import { prisma } from '../db/client';
import dayjs from 'dayjs';

export async function measurementsReport(params: { from?: string; to?: string; asset_id?: string; round_id?: string; user_id?: string }) {
  const where: any = {};
  if (params.from || params.to) {
    where.takenAt = {};
    if (params.from) where.takenAt.gte = dayjs(params.from).toDate();
    if (params.to) where.takenAt.lte = dayjs(params.to).toDate();
  }
  if (params.asset_id) where.assetId = params.asset_id;
  if (params.round_id) where.roundId = params.round_id;
  if (params.user_id) where.userId = params.user_id;

  return prisma.measurement.findMany({
    where,
    include: { asset: true, user: true, round: true },
    orderBy: { takenAt: 'desc' }
  });
}
