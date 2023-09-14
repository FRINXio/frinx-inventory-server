import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus';
import { toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Zone = objectType({
  name: 'Zone',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Zone', root.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('createdAt', {
      resolve: (root) => root.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (root) => root.updatedAt.toISOString(),
    });
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
    t.nonNull.int('totalCount');
  },
});

export const FilterZonesInput = inputObjectType({
  name: 'FilterZonesInput',
  definition: (t) => {
    t.nonNull.string('name');
  },
});

export const ZonesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('zones', {
      type: ZonesConnection,
      args: { ...PaginationConnectionArgs, filter: FilterZonesInput },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { filter } = args;
        const baseArgs = { where: { tenantId, ...(filter?.name ? filter : {}) } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.uniconfigZone.findMany({ ...baseArgs, ...paginationArgs }),
          () => prisma.uniconfigZone.count(baseArgs),
          args,
        );
        return result;
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
        const zone = await prisma.uniconfigZone.create({
          data: {
            name: args.input.name,
            tenantId,
          },
        });
        return { zone };
      },
    });
  },
});
