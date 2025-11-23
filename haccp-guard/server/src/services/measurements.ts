import { prisma } from '../db/client';
import { CorrectiveAction, Measurement } from '@prisma/client';

export interface MeasurementInput {
  id?: string;
  assetId: string;
  roundId?: string;
  userId?: string;
  valueC: number;
  stable?: boolean;
  inLimit?: boolean;
  limitMinC?: number;
  limitMaxC?: number;
  notes?: string | null;
  deviceId?: string;
  takenAt: Date;
  corrective?: { actionType: string; comment?: string | null; performedById?: string };
}

export async function createMeasurement(payload: MeasurementInput): Promise<{ measurement: Measurement; corrective?: CorrectiveAction }> {
  const asset = await prisma.asset.findUnique({ where: { id: payload.assetId } });
  if (!asset) throw new Error('Asset not found');

  const limitMin = payload.limitMinC ?? asset.limitMinC ?? null;
  const limitMax = payload.limitMaxC ?? asset.limitMaxC ?? null;
  const inLimit = payload.inLimit ?? (limitMin !== null && limitMax !== null ? payload.valueC >= limitMin && payload.valueC <= limitMax : null);

  if (inLimit === false && !payload.corrective) {
    throw new Error('Corrective action required when out of limit');
  }

  const measurement = await prisma.measurement.create({
    data: {
      id: payload.id,
      assetId: payload.assetId,
      roundId: payload.roundId,
      userId: payload.userId,
      deviceId: payload.deviceId,
      takenAt: payload.takenAt,
      valueC: payload.valueC,
      stable: payload.stable ?? false,
      inLimit,
      limitMinC: limitMin,
      limitMaxC: limitMax,
      notes: payload.notes ?? undefined
    }
  });

  let corrective: CorrectiveAction | undefined;
  if (payload.corrective) {
    corrective = await prisma.correctiveAction.create({
      data: {
        measurementId: measurement.id,
        actionType: payload.corrective.actionType,
        comment: payload.corrective.comment,
        performedById: payload.corrective.performedById
      }
    });
  }

  return { measurement, corrective };
}
