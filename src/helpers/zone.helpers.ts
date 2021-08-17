import { PrismaClient } from '@prisma/client';
import join from 'url-join';
import config from '../config';

export async function makeUniconfigURL(prismaClient: PrismaClient, zoneId: number | null): Promise<string | null> {
  if (zoneId == null) {
    return null;
  }
  const zone = await prismaClient.uniconfig_zones.findFirst({ where: { id: zoneId } });
  if (zone == null) {
    return null;
  }
  return join([`${config.uniconfigApiProtocol}://`, `${zone.name}:${config.uniconfigApiPort}/rests`]);
}
