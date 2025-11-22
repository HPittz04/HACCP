import { prisma } from '../db/client';
import { AssetType } from '@prisma/client';

export async function listAssets(params: { q?: string; type?: AssetType; active?: boolean }) {
  const where: any = {};
  if (params.q) where.name = { contains: params.q, mode: 'insensitive' };
  if (params.type) where.type = params.type;
  if (params.active !== undefined) where.isActive = params.active;
  return prisma.asset.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createAsset(data: {
  name: string;
  type: AssetType;
  location?: string;
  code?: string;
  limitMinC?: number;
  limitMaxC?: number;
  notes?: string;
}) {
  return prisma.asset.create({ data });
}

export async function updateAsset(id: string, data: Partial<Awaited<ReturnType<typeof createAsset>>>) {
  return prisma.asset.update({ where: { id }, data });
}
