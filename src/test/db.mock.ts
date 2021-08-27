import { Prisma } from '@prisma/client';

type CreateZoneData = Omit<Prisma.uniconfigZoneCreateArgs['data'], 'id'> & {
  id: string;
};

export const zone1: CreateZoneData = {
  id: 'ec6e6e77-43ec-47fb-b68a-10eb1149d090',
  name: 'zone1',
  tenantId: 'frinx',
};
