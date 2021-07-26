import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, intArg, nonNull, objectType, stringArg } from 'nexus';
import { convertDBZone } from '../helpers/converters';
import { Node, PageInfo } from './global-types';

export const Zone = objectType({
  name: 'Zone',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.string('name');
  },
});
export const ZoneEdge = objectType({
  name: 'ZoneEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: Zone,
    });
    t.nonNull.string('cursor');
  },
});
export const ZonesConnection = objectType({
  name: 'ZonesConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: ZoneEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
  },
});
export const ZonesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('zones', {
      type: ZonesConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const dbZones = await prisma.uniconfig_zones.findMany({ where: { tenant_id: tenantId } });
        const zones = dbZones.map(convertDBZone);
        return connectionFromArray(zones, args);
      },
    });
  },
});
export const AddZoneInput = inputObjectType({
  name: 'AddZoneInput',
  definition: (t) => {
    t.nonNull.string('name');
  },
});
export const AddZonePayload = objectType({
  name: 'AddZonePayload',
  definition: (t) => {
    t.nonNull.field('zone', { type: Zone });
  },
});
export const AddZoneMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addZone', {
      type: AddZonePayload,
      args: {
        input: nonNull(arg({ type: AddZoneInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const zone = await prisma.uniconfig_zones.create({
          data: {
            name: args.input.name,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            tenant_id: tenantId,
          },
        });
        return { zone: convertDBZone(zone) };
      },
    });
  },
});
