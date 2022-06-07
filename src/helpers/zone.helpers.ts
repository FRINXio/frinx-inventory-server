import { PrismaClient } from '@prisma/client';
import join from 'url-join';
import config from '../config';

export function makeUniconfigURL(zoneName: string): string {
  return join([`${config.uniconfigApiProtocol}://`, `${zoneName}:${config.uniconfigApiPort}/rests`]);
}

export async function getUniconfigURL(prismaClient: PrismaClient, zoneId: string): Promise<string> {
  const zone = await prismaClient.uniconfigZone.findFirst({ where: { id: zoneId } });
  if (zone == null) {
    throw new Error('zone not found');
  }
  return makeUniconfigURL(zone.name);
}
