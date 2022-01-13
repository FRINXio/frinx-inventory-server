import { difference } from 'lodash';
import { getUniconfigZones } from './external-api/krakend';
import getLogger from './get-logger';
import prismaClient from './prisma-client';
import config from './config';

const log = getLogger('frinx-inventory-server');

async function addZones(apiZones: string[], dbZones: string[]): Promise<void> {
  const zonesToAdd = difference(apiZones, dbZones);

  await prismaClient.uniconfigZone.createMany({
    data: zonesToAdd.map((z) => ({ name: z, tenantId: config.defaultTenantId })),
  });
}

async function deleteZones(apiZones: string[], dbZones: string[]): Promise<void> {
  const zonesToDelete = difference(dbZones, apiZones);

  await prismaClient.uniconfigZone.deleteMany({ where: { name: { in: zonesToDelete } } });
}

export default async function syncZones(): Promise<void> {
  log.info('syncing zones');
  const zones = await getUniconfigZones();
  const { instances } = zones;
  const existingZones = await prismaClient.uniconfigZone.findMany();
  const zonesNames = existingZones.map((z) => z.name);

  await addZones(instances, zonesNames);
  await deleteZones(instances, zonesNames);
}
