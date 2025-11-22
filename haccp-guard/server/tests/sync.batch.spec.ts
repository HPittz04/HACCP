import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import { prisma } from '../src/db/client';

jest.mock('../src/db/client', () => ({
  prisma: {
    device: { findUnique: jest.fn() },
    asset: { findUnique: jest.fn() },
    measurement: { findUnique: jest.fn(), create: jest.fn() },
    correctiveAction: { create: jest.fn() }
  }
}));

const secret = 'devsecret';

describe('POST /api/sync/batch', () => {
  beforeEach(() => {
    (prisma.device.findUnique as jest.Mock).mockResolvedValue({ id: 'dev1', secret });
    (prisma.asset.findUnique as jest.Mock).mockResolvedValue({ id: 'asset1', limitMinC: -2, limitMaxC: 4 });
    (prisma.measurement.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.measurement.create as jest.Mock).mockImplementation(({ data }: any) => ({ id: data.id, ...data }));
  });

  const buildSignature = (body: any) =>
    crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

  it('inserts measurement on happy path', async () => {
    const body = {
      device_id: 'dev1',
      items: [
        {
          type: 'measurement',
          id_local: 'ulid1',
          ts: new Date().toISOString(),
          payload: {
            asset_id: 'asset1',
            round_id: null,
            user_id: null,
            value_c: 2,
            stable: true,
            in_limit: true,
            limit_min_c: -2,
            limit_max_c: 4,
            device_id: 'dev1',
            taken_at: new Date().toISOString(),
            notes: null
          }
        }
      ]
    };
    const res = await request(app)
      .post('/api/sync/batch')
      .set('X-Device-ID', 'dev1')
      .set('X-Signature', buildSignature(body))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.results[0].ok).toBe(true);
  });

  it('is idempotent per id_local', async () => {
    (prisma.measurement.findUnique as jest.Mock).mockResolvedValue({ id: 'dev1-ulid1' });
    const body = { device_id: 'dev1', items: [{ type: 'measurement', id_local: 'ulid1', ts: new Date().toISOString(), payload: { asset_id: 'asset1', value_c: 1, in_limit: true, limit_min_c: -2, limit_max_c: 4, device_id: 'dev1', taken_at: new Date().toISOString(), notes: null } }] } as any;
    const res = await request(app)
      .post('/api/sync/batch')
      .set('X-Device-ID', 'dev1')
      .set('X-Signature', buildSignature(body))
      .send(body);
    expect(res.body.results[0].id).toBe('dev1-ulid1');
  });

  it('rejects missing corrective when out of limit', async () => {
    const body = { device_id: 'dev1', items: [{ type: 'measurement', id_local: 'ulid2', ts: new Date().toISOString(), payload: { asset_id: 'asset1', value_c: 10, in_limit: false, limit_min_c: -2, limit_max_c: 4, device_id: 'dev1', taken_at: new Date().toISOString(), notes: null } }] } as any;
    const res = await request(app)
      .post('/api/sync/batch')
      .set('X-Device-ID', 'dev1')
      .set('X-Signature', buildSignature(body))
      .send(body);
    expect(res.body.results[0].ok).toBe(false);
  });
});
