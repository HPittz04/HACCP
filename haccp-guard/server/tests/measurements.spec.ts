import { createMeasurement } from '../src/services/measurements';
import { prisma } from '../src/db/client';

jest.mock('../src/db/client', () => ({
  prisma: {
    asset: { findUnique: jest.fn() },
    measurement: { create: jest.fn() },
    correctiveAction: { create: jest.fn() }
  }
}));

describe('createMeasurement', () => {
  const asset = { id: 'asset1', limitMinC: -2, limitMaxC: 4 } as any;

  beforeEach(() => {
    (prisma.asset.findUnique as jest.Mock).mockResolvedValue(asset);
    (prisma.measurement.create as jest.Mock).mockImplementation(({ data }: any) => ({ id: data.id || 'm1', ...data }));
  });

  it('validates corrective action when out of limit', async () => {
    await expect(
      createMeasurement({ assetId: 'asset1', valueC: 10, takenAt: new Date(), inLimit: false })
    ).rejects.toThrow('Corrective action required when out of limit');
  });

  it('creates corrective when provided', async () => {
    const result = await createMeasurement({
      assetId: 'asset1',
      valueC: 1,
      takenAt: new Date(),
      inLimit: false,
      corrective: { actionType: 'ajustar' }
    });
    expect(result.corrective).toBeDefined();
    expect(prisma.correctiveAction.create).toHaveBeenCalled();
  });
});
