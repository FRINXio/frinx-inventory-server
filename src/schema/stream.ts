import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, enumType, extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import { getFilterQuery, getOrderingQuery } from '../helpers/device-helpers';
import { Node, PageInfo, PaginationConnectionArgs, SortDirection } from './global-types';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { decodeMountParams, getConnectionType, prepareInstallParameters } from '../helpers/converters';
import { getUniconfigURL } from '../helpers/zone.helpers';
import {
  getCachedDeviceInstallStatus,
  installDeviceCache,
  uninstallDeviceCache,
} from '../external-api/uniconfig-cache';
import { getMountParamsForStream, getUniconfigStreamName } from '../helpers/stream-helpers';

export const StreamNode = objectType({
  name: 'Stream',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (stream) => toGraphId('Stream', stream.id),
    });
    t.nonNull.string('createdAt', {
      resolve: (stream) => stream.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (stream) => stream.updatedAt.toISOString(),
    });
    t.nonNull.string('streamName');
    t.nonNull.string('deviceName');
    t.nonNull.boolean('isActive', {
      resolve: async (root, _, { prisma }) => {
        const device = await prisma.device.findFirst({ where: { name: root.deviceName } });

        if (device == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        const isActive = await getCachedDeviceInstallStatus(
          uniconfigURL,
          getUniconfigStreamName(root.streamName, root.deviceName),
        );
        return isActive;
      },
    });
  },
});

export const StreamEdge = objectType({
  name: 'StreamEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: StreamNode,
    });
    t.nonNull.string('cursor');
  },
});
export const StreamConnection = objectType({
  name: 'StreamConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: StreamEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});
export const FilterStreamsInput = inputObjectType({
  name: 'FilterStreamsInput',
  definition: (t) => {
    t.string('streamName', 'deviceName');
  },
});
export const SortStreamBy = enumType({
  name: 'SortStreamBy',
  members: ['streamName', 'createdAt'],
});
export const StreamOrderByInput = inputObjectType({
  name: 'StreamOrderByInput',
  definition: (t) => {
    t.nonNull.field('sortKey', { type: SortStreamBy });
    t.nonNull.field('direction', { type: SortDirection });
  },
});
export const StreamQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('streams', {
      type: StreamConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: FilterStreamsInput,
        orderBy: StreamOrderByInput,
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { filter, orderBy } = args;
        const filterQuery = getFilterQuery({ deviceName: filter?.streamName });
        const orderingArgs = getOrderingQuery(orderBy);
        const baseArgs = { where: { tenantId, ...filterQuery } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.stream.findMany({ ...baseArgs, ...orderingArgs, ...paginationArgs }),
          () => prisma.device.count(baseArgs),
          args,
        );

        return result;
      },
    });
  },
});

export const AddStreamInput = inputObjectType({
  name: 'AddStreamInput',
  definition: (t) => {
    t.nonNull.string('streamName');
    t.nonNull.string('deviceName');
  },
});

export const AddStreamPayload = objectType({
  name: 'AddStreamPayload',
  definition: (t) => {
    t.nonNull.field('stream', { type: StreamNode });
  },
});

export const AddStreamMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addStream', {
      type: AddStreamPayload,
      args: {
        input: nonNull(arg({ type: AddStreamInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { input } = args;
        const stream = await prisma.stream.create({
          data: {
            deviceName: input.deviceName,
            streamName: input.streamName,
            tenantId,
          },
        });

        return { stream };
      },
    });
  },
});

export const ActivateStreamPayload = objectType({
  name: 'ActivateStreamPayload',
  definition: (t) => {
    t.nonNull.field('stream', { type: StreamNode });
  },
});

export const ActivateStreamMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('activateStream', {
      type: ActivateStreamPayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Stream', args.id);
        const stream = await prisma.stream.findFirst({
          where: { id: nativeId, AND: { tenantId } },
          include: {
            device: true,
          },
        });

        if (stream == null) {
          throw new Error('stream not found');
        }

        const { streamName, deviceName, streamParameters, device } = stream;
        const uniconfigStreamName = getUniconfigStreamName(streamName, deviceName);
        // TODO: create column stream params
        const installDeviceParams = prepareInstallParameters(
          uniconfigStreamName,
          getMountParamsForStream(device.mountParameters, streamParameters),
        );

        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        await installDeviceCache({ uniconfigURL, deviceName: uniconfigStreamName, params: installDeviceParams });

        return { stream };
      },
    });
  },
});

export const DeactivateStreamPayload = objectType({
  name: 'DeactivateStreamPayload',
  definition: (t) => {
    t.nonNull.field('stream', { type: StreamNode });
  },
});
export const DeactivateStreamMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deactivateStream', {
      type: DeactivateStreamPayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Stream', args.id);
        const stream = await prisma.stream.findFirst({
          where: { id: nativeId, AND: { tenantId } },
          include: { device: true },
        });
        if (stream == null) {
          throw new Error('stream not found');
        }

        const { device } = stream;

        const uninstallParams = {
          input: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'node-id': getUniconfigStreamName(stream.streamName, stream.deviceName),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'connection-type': getConnectionType(decodeMountParams(device.mountParameters)),
          },
        };
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        await uninstallDeviceCache({
          uniconfigURL,
          params: uninstallParams,
          deviceName: getUniconfigStreamName(stream.streamName, stream.deviceName),
        });
        return { stream };
      },
    });
  },
});
