import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, enumType, extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import { getFilterQuery, getOrderingQuery, makeZonesWithDevicesFromDevices } from '../helpers/device-helpers';
import { Node, PageInfo, PaginationConnectionArgs, SortDirection } from './global-types';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import {
  decodeMountParams,
  getConnectionType,
  prepareInstallParameters,
  prepareMultipleInstallParameters,
} from '../helpers/converters';
import { getUniconfigURL } from '../helpers/zone.helpers';
import {
  getCachedDeviceInstallStatus,
  installDeviceCache,
  installMultipleDevicesCache,
  uninstallDeviceCache,
  uninstallMultipleDevicesCache,
} from '../external-api/uniconfig-cache';
import {
  getMountParamsForStream,
  getUniconfigStreamName,
  makeZonesWithStreamsFromStreams,
} from '../helpers/stream-helpers';
import config from '../config';
import { Blueprint } from './blueprint';

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
    t.string('streamParameters', {
      resolve: async (root) => {
        if (root.streamParameters != null) {
          return JSON.stringify(root.streamParameters);
        }
        return null;
      },
    });
    t.field('blueprint', {
      type: Blueprint,
      resolve: async (stream, _, { prisma }) => {
        const { blueprintId } = stream;

        if (blueprintId == null) {
          return null;
        }

        const blueprint = await prisma.blueprint.findUnique({ where: { id: blueprintId } });
        return blueprint;
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
    t.string('streamParameters');
    t.string('blueprintId');
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
        const nativeBlueprintId = input.blueprintId != null ? fromGraphId('Blueprint', input.blueprintId) : undefined;
        const stream = await prisma.stream.create({
          data: {
            deviceName: input.deviceName,
            streamName: input.streamName,
            streamParameters: input.streamParameters != null ? JSON.parse(input.streamParameters) : undefined,
            blueprintId: nativeBlueprintId,
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
        const installStreamParams = prepareInstallParameters(
          uniconfigStreamName,
          getMountParamsForStream(device.mountParameters, streamParameters),
        );

        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        await installDeviceCache({ uniconfigURL, deviceName: uniconfigStreamName, params: installStreamParams });

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

export const DeleteStreamPayload = objectType({
  name: 'DeleteStreamPayload',
  definition: (t) => {
    t.field('stream', { type: StreamNode });
  },
});

export const DeleteStreamMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deleteStream', {
      type: DeleteStreamPayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId, kafka, inventoryKafka }) => {
        const nativeId = fromGraphId('Stream', args.id);
        const dbStream = await prisma.stream.findFirst({
          where: { id: nativeId, AND: { tenantId } },
          include: { device: true },
        });
        if (dbStream == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbStream.device.uniconfigZoneId);
        const isActive = await getCachedDeviceInstallStatus(
          uniconfigURL,
          getUniconfigStreamName(dbStream.streamName, dbStream.deviceName),
        );
        if (isActive) {
          throw new Error('stream is installed in UniConfig');
        }

        try {
          const deletedStream = await prisma.stream.delete({ where: { id: nativeId } });

          if (config.kafkaEnabled) {
            await inventoryKafka?.produceDeviceRemovalEvent(
              kafka,
              getUniconfigStreamName(dbStream.streamName, dbStream.deviceName),
            );
          }

          return { stream: deletedStream };
        } catch (error) {
          throw new Error('Error deleting stream');
        }
      },
    });
  },
});

export const UpdateStreamInput = inputObjectType({
  name: 'UpdateStreamInput',
  definition: (t) => {
    t.nonNull.string('streamName');
    t.nonNull.string('deviceName');
    t.string('blueprintId');
    t.string('streamParameters');
  },
});
export const UpdateStreamPayload = objectType({
  name: 'UpdateStreamPayload',
  definition: (t) => {
    t.field('stream', { type: StreamNode });
  },
});
export const UpdateStreamMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateStream', {
      type: UpdateStreamPayload,
      args: {
        id: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateStreamInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Stream', args.id);
        const dbStream = await prisma.stream.findFirst({
          where: { id: nativeId, tenantId },
          include: { device: true },
        });
        if (dbStream == null) {
          throw new Error('stream not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbStream.device.uniconfigZoneId);
        const isActive = await getCachedDeviceInstallStatus(
          uniconfigURL,
          getUniconfigStreamName(dbStream.streamName, dbStream.deviceName),
        );
        if (isActive) {
          throw new Error('active is installed in UniConfig');
        }
        const { input } = args;
        const streamParameters =
          input.streamParameters != null ? JSON.parse(input.streamParameters) : input.streamParameters;

        try {
          const updatedStream = await prisma.stream.update({
            where: { id: nativeId },
            data: {
              streamName: input.streamName,
              deviceName: input.deviceName,
              streamParameters,
              // blueprint: input.blueprintId
              //   ? { connect: { id: fromGraphId('Blueprint', input.blueprintId) } }
              //   : undefined,
            },
          });

          return { stream: updatedStream };
        } catch (error) {
          throw new Error('Error updating device');
        }
      },
    });
  },
});

export const BulkInstallStreamPayload = objectType({
  name: 'BulkInstallStreamPayload',
  definition: (t) => {
    t.nonNull.list.nonNull.field('installedStreams', { type: StreamNode });
  },
});

export const BulkInstallStreamsInput = inputObjectType({
  name: 'BulkInstallStreamsInput',
  definition: (t) => {
    t.nonNull.list.nonNull.string('streamIds');
  },
});

export const BulkInstallStreamsMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('bulkInstallStreams', {
      type: BulkInstallStreamPayload,
      args: {
        input: nonNull(arg({ type: BulkInstallStreamsInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { streamIds } = args.input;
        const nativeIds = streamIds.map((id) => fromGraphId('Stream', id));
        const streams = await prisma.stream.findMany({
          where: { id: { in: nativeIds }, tenantId },
          include: {
            device: true,
          },
        });
        const zonesWithStreams = makeZonesWithStreamsFromStreams(streams);

        const streamsToInstallWithParams = [...zonesWithStreams.entries()].map(
          ([uniconfigZoneId, devicesToInstall]) => ({
            uniconfigURL: getUniconfigURL(prisma, uniconfigZoneId),
            devicesToInstall: prepareMultipleInstallParameters(devicesToInstall),
            deviceNames: devicesToInstall.map((device) => device.deviceName),
          }),
        );

        await Promise.all(
          streamsToInstallWithParams.map((streamsToInstall) => installMultipleDevicesCache(streamsToInstall)),
        );

        return { installedStreams: streams };
      },
    });
  },
});

export const BulkUninstallStreamPayload = objectType({
  name: 'BulkUninstallStreamPayload',
  definition: (t) => {
    t.nonNull.list.nonNull.field('uninstalledStreams', { type: StreamNode });
  },
});

export const BulkUninstallStreamsInput = inputObjectType({
  name: 'BulkUninstallStreamsInput',
  definition: (t) => {
    t.nonNull.list.nonNull.string('streamIds');
  },
});

export const BulkUninstallDevicesMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('bulkUninstallStreams', {
      type: BulkUninstallStreamPayload,
      args: {
        input: nonNull(arg({ type: BulkUninstallStreamsInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { streamIds } = args.input;
        const nativeIds = streamIds.map((id) => fromGraphId('Stream', id));
        const streams = await prisma.stream.findMany({
          where: { id: { in: nativeIds }, tenantId },
          include: { device: true },
        });
        const deviceStreamMap = new Map(streams.map((s) => [s.deviceName, s]));
        const zonesWithDevices = makeZonesWithDevicesFromDevices(streams.map((s) => s.device));

        const streamsToUninstallWithParams = [...zonesWithDevices.entries()].map(
          ([uniconfigZoneId, devicesToUninstall]) => ({
            uniconfigURL: getUniconfigURL(prisma, uniconfigZoneId),
            devicesToUninstall: {
              input: {
                nodes: devicesToUninstall.map(({ deviceName, params }) => ({
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'node-id': getUniconfigStreamName(deviceStreamMap.get(deviceName)?.streamName ?? '', deviceName),
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'connection-type': getConnectionType(decodeMountParams(params)),
                })),
              },
            },
            deviceNames: devicesToUninstall.map((device) => device.deviceName),
          }),
        );

        await Promise.all(
          streamsToUninstallWithParams.map((streamsToUninstall) => uninstallMultipleDevicesCache(streamsToUninstall)),
        );

        return { uninstalledStreams: streams };
      },
    });
  },
});
