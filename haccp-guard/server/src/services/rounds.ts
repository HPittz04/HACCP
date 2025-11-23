import { prisma } from '../db/client';
import { RoundStatus } from '@prisma/client';
import dayjs from 'dayjs';

export async function generateRoundsForDate(date: string) {
  const target = dayjs(date).startOf('day');
  const templates = await prisma.roundTemplate.findMany();
  const created: string[] = [];
  for (const template of templates) {
    const existing = await prisma.round.findFirst({
      where: { templateId: template.id, plannedAt: { gte: target.toDate(), lte: target.endOf('day').toDate() } }
    });
    if (existing) continue;
    const plannedAt = target.hour(6).toDate();
    const round = await prisma.round.create({ data: { templateId: template.id, plannedAt } });
    created.push(round.id);
  }
  return created;
}

export async function listRounds(params: { date?: string; status?: RoundStatus; assigned_to?: string }) {
  const where: any = {};
  if (params.date) {
    const d = dayjs(params.date);
    where.plannedAt = { gte: d.startOf('day').toDate(), lte: d.endOf('day').toDate() };
  }
  if (params.status) where.status = params.status;
  if (params.assigned_to) where.assignedTo = params.assigned_to;
  return prisma.round.findMany({ where, include: { template: true, measurements: true }, orderBy: { plannedAt: 'asc' } });
}

export async function markRound(id: string, status: RoundStatus) {
  return prisma.round.update({ where: { id }, data: { status } });
}
