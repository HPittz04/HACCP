import { PrismaClient, Role, AssetType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const pin = await argon2.hash('1234');

  await prisma.user.upsert({
    where: { username: 'admin' },
    create: { username: 'admin', pinHash: pin, role: Role.admin },
    update: { pinHash: pin }
  });

  for (const username of ['op1', 'op2']) {
    await prisma.user.upsert({
      where: { username },
      create: { username, pinHash: pin, role: Role.operator },
      update: { pinHash: pin }
    });
  }

  const assets = [
    { name: 'Câmara Frio 1', type: AssetType.equipment, limitMinC: -2, limitMaxC: 4, location: 'Armazém' },
    { name: 'Câmara Frio 2', type: AssetType.equipment, limitMinC: -2, limitMaxC: 4, location: 'Armazém' },
    { name: 'Expositor 3', type: AssetType.equipment, limitMinC: -2, limitMaxC: 4, location: 'Loja' },
    { name: 'Banho-maria', type: AssetType.equipment, limitMinC: 63, limitMaxC: 75, location: 'Cozinha' },
    { name: 'Forno', type: AssetType.equipment, limitMinC: 63, limitMaxC: 75, location: 'Cozinha' }
  ];

  await Promise.all(
    assets.map((asset, idx) =>
      prisma.asset.upsert({
        where: { code: `asset-${idx}` },
        create: { ...asset, code: `asset-${idx}` },
        update: asset
      })
    )
  );

  const assetIds = await prisma.asset.findMany({ select: { id: true } });
  const idsJson = JSON.stringify(assetIds.map((a) => a.id));

  const templateData = [
    { name: 'Ronda Frio', schedule: '0 6,14,22 * * *', assetIds: idsJson },
    { name: 'Ronda Quente', schedule: '0 6,14,22 * * *', assetIds: idsJson }
  ];

  for (const t of templateData) {
    await prisma.roundTemplate.upsert({
      where: { name: t.name },
      create: t,
      update: { schedule: t.schedule, assetIds: t.assetIds }
    });
  }

  await prisma.device.upsert({
    where: { id: 'esp32-demo' },
    create: { id: 'esp32-demo', secret: 'demo_secret', label: 'Demo ESP32' },
    update: { secret: 'demo_secret' }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
