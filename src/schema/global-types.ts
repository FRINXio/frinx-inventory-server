import countries from 'i18n-iso-countries';
import {
  enumType,
  extendType,
  idArg,
  intArg,
  interfaceType,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from 'nexus';
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
          case 'Stream': {
            const id = fromGraphId('Stream', args.id);
            const stream = await prisma.stream.findFirst({
              where: { id, tenantId },
            });
            if (stream == null) {
              return null;
            }
            if (stream == null) {
              throw new Error('stream not found');
            }
            return { ...stream, __typename: 'Stream' };
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

export const IsOkResponse = objectType({
  name: 'IsOkResponse',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});

export const SortDirection = enumType({
  name: 'SortDirection',
  members: ['ASC', 'DESC'],
});

export const KafkaHealthCheckQuery = queryField('kafkaHealthCheck', {
  type: IsOkResponse,
  resolve: async (root, _, { kafka }) => {
    if (kafka == null) {
      return { isOk: false };
    }

    await kafka.consumerConnect();
    const isOk = await kafka.isHealthy();
    await kafka.consumerDisconnect();
    return { isOk };
  },
});

export const ReconnectKafkaMutation = mutationField('reconnectKafka', {
  type: IsOkResponse,
  resolve: async (root, _, { kafka }) => {
    if (kafka == null) {
      return { isOk: false };
    }

    await kafka.producerDisconnect();
    await kafka.producerConnect();

    return { isOk: true };
  },
});
