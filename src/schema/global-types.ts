import countries from 'i18n-iso-countries';
import { extendType, idArg, intArg, interfaceType, nonNull, objectType, stringArg } from 'nexus';
import { fromGraphId, getType } from '../helpers/id-helper';

export const Node = interfaceType({
  name: 'Node',
  definition: (t) => {
    t.nonNull.id('id');
  },
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
export const PaginationConnectionArgs = {
  first: intArg(),
  after: stringArg(),
  last: intArg(),
  before: stringArg(),
};
export const NodeQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('node', {
      type: Node,
      args: {
        id: nonNull(idArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        /* eslint-disable @typescript-eslint/naming-convention */
        const type = getType(args.id);
        switch (type) {
          case 'Device': {
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
            return { ...device, __typename: 'Device' };
          }
          case 'Zone': {
            const id = fromGraphId('Zone', args.id);
            const zone = await prisma.uniconfigZone.findFirst({
              where: { id, tenantId },
            });
            if (zone == null) {
              return null;
            }
            return { ...zone, __typename: 'Zone' };
          }
          case 'Label': {
            const id = fromGraphId('Label', args.id);
            const label = await prisma.label.findFirst({ where: { id, tenantId } });
            if (label == null) {
              return null;
            }
            return { ...label, __typename: 'Label' };
          }
          case 'Location': {
            const id = fromGraphId('Location', args.id);
            const location = await prisma.location.findFirst({ where: { id, tenantId } });
            if (location == null) {
              return null;
            }
            return { ...location, __typename: 'Location' };
          }
          case 'Country': {
            const id = fromGraphId('Country', args.id);
            if (!countries.isValid(id)) {
              return null;
            }
            const countryName = countries.getName(id, 'en', { select: 'official' });
            return {
              id: args.id,
              code: id,
              name: countryName,
              __typename: 'Country',
            };
          }
          case 'Blueprint': {
            const id = fromGraphId('Blueprint', args.id);
            const blueprint = await prisma.blueprint.findFirst({ where: { id, tenantId } });
            if (blueprint == null) {
              return null;
            }
            return { ...blueprint, __typename: 'Blueprint' };
          }
          /* eslint-enable */
          default:
            return null;
        }
      },
    });
  },
});
