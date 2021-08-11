import { difference } from 'lodash';
import { getUniconfigZones } from './external-api/krakend';
import getLogger from './get-logger';
import prismaClient from './prisma-client';

const log = getLogger('frinx-inventory-server');

async function addZones(apiZones: string[], dbZones: string[]): Promise<void> {
  const zonesToAdd = difference(apiZones, dbZones);

  await prismaClient.uniconfig_zones.createMany({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    data: zonesToAdd.map((z) => ({ name: z, tenant_id: 'frinx' })),
  });
}

async function deleteZones(apiZones: string[], dbZones: string[]): Promise<void> {
  const zonesToDelete = difference(dbZones, apiZones);

  await prismaClient.uniconfig_zones.deleteMany({ where: { name: { in: zonesToDelete } } });
}

export default async function syncZones(): Promise<void> {
  log.info('syncing zones');
  const zones = await getUniconfigZones();
  const { instances } = zones;
  const existingZones = await prismaClient.uniconfig_zones.findMany();
  const zonesNames = existingZones.map((z) => z.name);

  await addZones(instances, zonesNames);
  await deleteZones(instances, zonesNames);
}
