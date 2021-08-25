import { extendType, idArg, interfaceType, nonNull, objectType } from 'nexus';
import countries from 'i18n-iso-countries';
import { fromGraphId, getType } from '../helpers/id-helper';

export const Node = interfaceType({
  name: 'Node',
  definition: (t) => {
    t.nonNull.id('id');
  },
  resolveType: (item) => getType(item.id),
});
export const PageInfo = objectType({
  name: 'PageInfo',
  definition: (t) => {
    t.string('startCursor');
    t.string('endCursor');
    t.nonNull.boolean('hasNextPage');
    t.nonNull.boolean('hasPreviousPage');
  },
});
export const NodeQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('node', {
      type: Node,
      args: {
        id: nonNull(idArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const type = getType(args.id);
        if (type === 'Device') {
          const id = fromGraphId('Device', args.id);
          const device = await prisma.device.findFirst({
            where: { id, tenantId },
          });
          if (device == null) {
            return null;
          }
          if (device == null) {
            throw new Error('device not found');
          }
          return device;
        }
        if (type === 'Zone') {
          const id = fromGraphId('Zone', args.id);
          const zone = await prisma.uniconfigZone.findFirst({
            where: { id, tenantId },
          });
          if (zone == null) {
            return null;
          }
          return zone;
        }
        if (type === 'Label') {
          const id = fromGraphId('Label', args.id);
          const label = await prisma.label.findFirst({ where: { id, tenantId } });
          if (label == null) {
            return null;
          }
          return label;
        }
        if (type === 'Location') {
          const id = fromGraphId('Location', args.id);
          const location = await prisma.location.findFirst({ where: { id, tenantId } });
          if (location == null) {
            return null;
          }
          return location;
        }
        if (type === 'Country') {
          const id = fromGraphId('Country', args.id);
          if (!countries.isValid(id)) {
            return null;
          }
          const countryName = countries.getName(id, 'en', { select: 'official' });
          return {
            id: args.id,
            code: id,
            name: countryName,
          };
        }
        return null;
      },
    });
  },
});
