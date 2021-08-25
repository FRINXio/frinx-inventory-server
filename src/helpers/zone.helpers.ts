import { PrismaClient } from '@prisma/client';
import join from 'url-join';
import config from '../config';

export async function makeUniconfigURL(prismaClient: PrismaClient, zoneId: string): Promise<string> {
  const zone = await prismaClient.uniconfigZone.findFirst({ where: { id: zoneId } });
  if (zone == null) {
    throw new Error('zone not found');
  }
  return join([`${config.uniconfigApiProtocol}://`, `${zone.name}:${config.uniconfigApiPort}/rests`]);
}
