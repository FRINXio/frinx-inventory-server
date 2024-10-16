import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { Prisma } from '@prisma/client';
import { parse as csvParse } from 'csv-parse';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js'; // eslint-disable-line import/extensions
import jsonParse from 'json-templates';
import {
  arg,
  asNexusMethod,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from 'nexus';
import { Stream } from 'node:stream';
import { v4 as uuid } from 'uuid';
import {
  getCachedDeviceInstallStatus,
  installDeviceCache,
  installMultipleDevicesCache,
  UniconfigCache,
  uninstallDeviceCache,
  uninstallMultipleDevicesCache,
} from '../external-api/uniconfig-cache';
import {
  decodeMountParams,
  getConnectionType,
  prepareInstallParameters,
  prepareMultipleInstallParameters,
} from '../helpers/converters';
import { getFilterQuery, getOrderingQuery, makeZonesWithDevicesFromDevices } from '../helpers/device-helpers';
import { decodeMetadataOutput } from '../helpers/device-types';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { CSVParserToPromise, CSVValuesToJSON, isHeaderValid } from '../helpers/import-csv.helpers';
import { getUniconfigURL } from '../helpers/zone.helpers';
import { sshClient } from '../uniconfig-shell';
import { Blueprint } from './blueprint';
import { Node, PageInfo, PaginationConnectionArgs, SortDirection } from './global-types';
import { LabelConnection } from './label';
import { Location } from './location';
import { Zone } from './zone';
import config from '../config';
import { ExternalApiError } from '../external-api/errors';

export const DeviceServiceState = enumType({
  name: 'DeviceServiceState',
  members: ['PLANNING', 'IN_SERVICE', 'OUT_OF_SERVICE'],
});
export const DeviceSource = enumType({
  name: 'DeviceSource',
  members: ['MANUAL', 'DISCOVERED', 'IMPORTED'],
});
export const DeviceSize = enumType({
  name: 'DeviceSize',
  members: ['SMALL', 'MEDIUM', 'LARGE'],
});

export const Device = objectType({
  name: 'Device',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (device) => toGraphId('Device', device.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('createdAt', {
      resolve: (device) => device.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (device) => device.updatedAt.toISOString(),
    });
    t.string('discoveredAt', {
      resolve: (device) => {
        if (device.discoveredAt == null) {
          return null;
        }
        return device.discoveredAt.toISOString();
      },
    });
    t.string('model', {
      resolve: (root) => (root.model == null || root.model.trim().length === 0 ? null : root.model),
    });
    t.string('vendor');
    t.string('version', {
      resolve: (root) => {
        if (root.version != null && root.version.length > 0) {
          return root.version;
        }

        return null;
      },
    });
    t.string('software', {
      resolve: (root) => (root.software == null || root.software.trim().length === 0 ? null : root.software),
    });
    t.int('port');
    t.string('address', {
      resolve: async (root) => root.managementIp,
    });
    t.string('mountParameters', {
      resolve: async (root) => {
        if (root.mountParameters != null) {
          return JSON.stringify(root.mountParameters);
        }
        return null;
      },
    });
    t.nonNull.field('source', { type: DeviceSource });
    t.nonNull.field('serviceState', { type: DeviceServiceState });
    t.nonNull.boolean('isInstalled', {
      resolve: async (root, _, { prisma }) => {
        const { uniconfigZoneId } = root;
        try {
          const uniconfigURL = await getUniconfigURL(prisma, uniconfigZoneId);
          const isInstalled = await getCachedDeviceInstallStatus(uniconfigURL, root.name);
          return isInstalled;
        } catch {
          // FD-683 supress isInstalled error when something is wrong with uniconfig
          return false;
        }
      },
    });
    t.nonNull.field('zone', {
      type: Zone,
      resolve: async (root, _, { prisma }) => {
        const { uniconfigZoneId } = root;
        const zone = await prisma.uniconfigZone.findFirst({ where: { id: uniconfigZoneId } });
        if (zone == null) {
          throw new Error('should never happen');
        }

        return zone;
      },
    });
    t.nonNull.field('labels', {
      type: LabelConnection,
      args: PaginationConnectionArgs,
      resolve: async (root, args, { prisma, tenantId }) => {
        const baseArgs = { where: { tenantId, device: { some: { deviceId: root.id } } } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.label.findMany({ ...baseArgs, ...paginationArgs }),
          () => prisma.label.count(baseArgs),
          args,
        );
        return result;
      },
    });
    t.field('location', {
      type: Location,
      resolve: async (device, _, { prisma }) => {
        const location = await prisma.device.findFirst({ where: { id: device.id } }).location();
        if (location == null) {
          return null;
        }
        return location;
      },
    });
    t.nonNull.field('deviceSize', {
      type: DeviceSize,
      resolve: async (device) => {
        const { metadata } = device;

        const deviceSize = decodeMetadataOutput(metadata)?.deviceSize || 'MEDIUM';
        return deviceSize;
      },
    });
    t.field('blueprint', {
      type: Blueprint,
      resolve: async (device, _, { prisma }) => {
        const { blueprintId } = device;

        if (blueprintId == null) {
          return null;
        }

        const blueprint = await prisma.blueprint.findUnique({ where: { id: blueprintId } });
        return blueprint;
      },
    });
  },
});
export const DeviceEdge = objectType({
  name: 'DeviceEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: Device,
    });
    t.nonNull.string('cursor');
  },
});
export const DeviceConnection = objectType({
  name: 'DeviceConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: DeviceEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});
export const FilterDevicesInput = inputObjectType({
  name: 'FilterDevicesInput',
  definition: (t) => {
    t.list.nonNull.string('labels');
    t.string('deviceName');
  },
});
export const SortDeviceBy = enumType({
  name: 'SortDeviceBy',
  members: ['name', 'discoveredAt', 'modelVersion'],
});
export const DeviceOrderByInput = inputObjectType({
  name: 'DeviceOrderByInput',
  definition: (t) => {
    t.nonNull.field('sortKey', { type: SortDeviceBy });
    t.nonNull.field('direction', { type: SortDirection });
  },
});

export const DevicesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('devices', {
      type: DeviceConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: FilterDevicesInput,
        orderBy: DeviceOrderByInput,
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { filter, orderBy } = args;
        const labels = filter?.labels ?? [];
        const dbLabels = await prisma.label.findMany({ where: { name: { in: labels } } });
        const labelIds = dbLabels.map((l) => l.id);
        const filterQuery = getFilterQuery({ deviceName: filter?.deviceName, labelIds });
        const orderingArgs = getOrderingQuery(orderBy);
        const baseArgs = { where: { tenantId, ...filterQuery } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.device.findMany({ ...baseArgs, ...orderingArgs, ...paginationArgs }),
          () => prisma.device.count(baseArgs),
          args,
        );

        return result;
      },
    });
  },
});
export const AddDeviceInput = inputObjectType({
  name: 'AddDeviceInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('zoneId');
    t.list.nonNull.string('labelIds');
    t.field({ name: 'deviceSize', type: DeviceSize });
    t.field('serviceState', { type: DeviceServiceState });
    t.string('mountParameters');
    t.string('blueprintId');
    t.string('model');
    t.string('vendor');
    t.string('address');
    t.string('username');
    t.string('password');
    t.int('port');
    t.string('deviceType');
    t.string('version');
    t.string('locationId');
  },
});
export const AddDevicePayload = objectType({
  name: 'AddDevicePayload',
  definition: (t) => {
    t.nonNull.field('device', { type: Device });
  },
});
export const AddDeviceMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addDevice', {
      type: AddDevicePayload,
      args: {
        input: nonNull(arg({ type: AddDeviceInput })),
      },
      resolve: async (_, args, { prisma, tenantId, kafka, inventoryKafka }) => {
        const { input } = args;
        const nativeZoneId = fromGraphId('Zone', input.zoneId);
        const nativeLocationId = input.locationId ? fromGraphId('Location', input.locationId) : null;
        const zone = await prisma.uniconfigZone.findFirst({ where: { tenantId, id: nativeZoneId } });
        const deviceLocation = await prisma.location.findFirst({
          where: { id: nativeLocationId ?? undefined },
        });

        if (zone == null) {
          throw new Error('zone not found');
        }
        const labelIds = input.labelIds ? [...new Set(input.labelIds)] : null;
        try {
          const nativeBlueprintId = input.blueprintId != null ? fromGraphId('Blueprint', input.blueprintId) : undefined;
          const device = await prisma.device.create({
            data: {
              name: input.name,
              uniconfigZoneId: nativeZoneId,
              tenantId,
              model: input.model,
              vendor: input.vendor,
              managementIp: input.address,
              username: input.username,
              password: input.password,
              port: input.port ?? undefined,
              deviceType: input.deviceType,
              version: input.version,
              locationId: input.locationId ? fromGraphId('Location', input.locationId) : undefined,
              mountParameters: input.mountParameters != null ? JSON.parse(input.mountParameters) : undefined,
              source: 'MANUAL',
              serviceState: input.serviceState ?? undefined,
              blueprintId: nativeBlueprintId,
              label: labelIds
                ? { createMany: { data: labelIds.map((id) => ({ labelId: fromGraphId('Label', id) })) } }
                : undefined,
              metadata: {
                deviceSize: input.deviceSize ?? 'MEDIUM',
              },
            },
          });

          const geoLocation: [number, number] | null =
            deviceLocation?.latitude && deviceLocation?.longitude
              ? [Number.parseFloat(deviceLocation.latitude ?? '0'), Number.parseFloat(deviceLocation.longitude ?? '0')]
              : null;

          if (config.kafkaEnabled) {
            await inventoryKafka?.produceDeviceRegistrationEvent(kafka, device, geoLocation, labelIds ?? []);
          }

          return { device };
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2002') {
              throw new Error('There is a unique constraint violation, a new device cannot be added with this name.');
            }
          }
          throw e;
        }
      },
    });
  },
});

export const UpdateDeviceInput = inputObjectType({
  name: 'UpdateDeviceInput',
  definition: (t) => {
    t.string('mountParameters');
    t.string('blueprintId');
    t.string('model');
    t.string('vendor');
    t.string('address');
    t.string('username');
    t.string('password');
    t.int('port');
    t.string('deviceType');
    t.field({
      name: 'deviceSize',
      type: DeviceSize,
    });
    t.string('version');
    t.list.nonNull.string('labelIds');
    t.field('serviceState', { type: DeviceServiceState });
    t.string('locationId');
  },
});
export const UpdateDevicePayload = objectType({
  name: 'UpdateDevicePayload',
  definition: (t) => {
    t.field('device', { type: Device });
  },
});
export const UpdateDeviceMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateDevice', {
      type: UpdateDevicePayload,
      args: {
        id: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateDeviceInput })),
      },
      resolve: async (_, args, { prisma, tenantId, kafka, inventoryKafka }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, tenantId },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }

        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);

        // FR-333 - force cache to read new value from uniconfig
        const cache = UniconfigCache.getInstance();
        cache.delete(uniconfigURL, dbDevice.name);

        const isInstalled = await getCachedDeviceInstallStatus(uniconfigURL, dbDevice.name);
        if (isInstalled) {
          throw new Error('device is installed in UniConfig');
        }
        const { input } = args;
        const deviceMountParameters =
          input.mountParameters != null ? JSON.parse(input.mountParameters) : input.mountParameters;
        const labelIds = input.labelIds ?? [];

        try {
          await prisma.$transaction([
            prisma.deviceLabel.deleteMany({ where: { deviceId: nativeId } }),
            prisma.deviceLabel.createMany({
              data: labelIds.map((lId) => {
                const nativeLabelId = fromGraphId('Label', lId);
                return { labelId: nativeLabelId, deviceId: nativeId };
              }),
            }),
          ]);
          const oldMetadata = decodeMetadataOutput(dbDevice.metadata);
          const newMetadata = {
            ...oldMetadata,
            deviceSize: input.deviceSize,
          };

          const updatedDevice = await prisma.device.update({
            where: { id: nativeId },
            data: {
              model: input.model,
              vendor: input.vendor,
              managementIp: input.address,
              mountParameters: deviceMountParameters,
              deviceType: input.deviceType,
              version: input.version,
              username: input.username,
              password: input.password,
              port: input.port,
              serviceState: input.serviceState ?? undefined,
              location: input.locationId
                ? { connect: { id: fromGraphId('Location', input.locationId) } }
                : {
                    disconnect: true,
                  },
              blueprint: input.blueprintId
                ? { connect: { id: fromGraphId('Blueprint', input.blueprintId) } }
                : undefined,
              ...(input.deviceSize != null && {
                metadata: newMetadata,
              }),
            },
          });

          const deviceLocation = await prisma.location.findFirst({
            where: { id: updatedDevice.locationId ?? undefined },
          });

          const geoLocation: [number, number] | null =
            deviceLocation?.latitude && deviceLocation?.longitude
              ? [Number.parseFloat(deviceLocation.latitude ?? '0'), Number.parseFloat(deviceLocation.longitude ?? '0')]
              : null;

          if (config.kafkaEnabled) {
            await inventoryKafka?.produceDeviceUpdateEvent(kafka, updatedDevice, geoLocation, labelIds);
          }

          return { device: updatedDevice };
        } catch (error) {
          throw new Error('Error updating device');
        }
      },
    });
  },
});

export const UpdateDeviceMetadataPayload = objectType({
  name: 'UpdateDeviceMetadataPayload',
  definition: (t) => {
    t.list.field('devices', { type: Device });
  },
});

export const DeviceDiscoveryPayload = objectType({
  name: 'DeviceDiscoveryPayload',
  definition(t) {
    t.nonNull.string('deviceId');
    t.string('discoveredAt');
  },
});

export const UpdateDiscoveredAtMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateDiscoveredAt', {
      type: nonNull(list(nonNull('DeviceDiscoveryPayload'))),
      args: {
        deviceIds: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_, { deviceIds }, { prisma }) => {
        const currentTimestamp = new Date();
        const nativeIds = deviceIds.map((id) => fromGraphId('Device', id));
        await prisma.device.updateMany({
          where: {
            id: {
              in: nativeIds,
            },
          },
          data: {
            discoveredAt: currentTimestamp,
          },
        });

        const updatedDevices = await prisma.device.findMany({
          where: {
            id: {
              in: nativeIds,
            },
          },
          select: {
            id: true,
            discoveredAt: true,
          },
        });

        return updatedDevices.map((device) => ({
          deviceId: toGraphId('Device', device.id),
          discoveredAt: device.discoveredAt ? device.discoveredAt.toISOString() : null,
        }));
      },
    });
  },
});

export const DeleteDevicePayload = objectType({
  name: 'DeleteDevicePayload',
  definition: (t) => {
    t.field('device', { type: Device });
  },
});
export const DeleteDeviceMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deleteDevice', {
      type: DeleteDevicePayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId, kafka, inventoryKafka }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const isInstalled = await getCachedDeviceInstallStatus(uniconfigURL, dbDevice.name);
        if (isInstalled) {
          throw new Error('device is installed in UniConfig');
        }

        try {
          const deletedDevice = await prisma.device.delete({ where: { id: nativeId } });

          if (config.kafkaEnabled) {
            await inventoryKafka?.produceDeviceRemovalEvent(kafka, deletedDevice.name);
          }

          return { device: deletedDevice };
        } catch (error) {
          throw new Error('Error deleting device');
        }
      },
    });
  },
});

export const InstallDevicePayload = objectType({
  name: 'InstallDevicePayload',
  definition: (t) => {
    t.nonNull.field('device', { type: Device });
  },
});
export const InstallDeviceMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('installDevice', {
      type: InstallDevicePayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Device', args.id);
        const device = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (device == null) {
          throw new Error('device not found');
        }
        const { mountParameters } = device;
        const installDeviceParams = prepareInstallParameters(device.name, mountParameters);
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        try {
          await installDeviceCache({ uniconfigURL, deviceName: device.name, params: installDeviceParams });
        } catch (e) {
          if (e instanceof ExternalApiError) {
            throw new Error(e.getErrorMessage());
          }

          throw e;
        }
        return { device };
      },
    });
  },
});
export const UninstallDevicePayload = objectType({
  name: 'UninstallDevicePayload',
  definition: (t) => {
    t.nonNull.field('device', { type: Device });
  },
});
export const UninstallDeviceMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('uninstallDevice', {
      type: UninstallDevicePayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Device', args.id);
        const device = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (device == null) {
          throw new Error('device not found');
        }

        const uninstallParams = {
          input: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'node-id': device.name,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'connection-type': getConnectionType(decodeMountParams(device.mountParameters)),
          },
        };
        if (device == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        try {
          await uninstallDeviceCache({ uniconfigURL, params: uninstallParams, deviceName: device.name });
        } catch (e) {
          if (e instanceof ExternalApiError) {
            throw new Error(e.getErrorMessage());
          }
        }
        return { device };
      },
    });
  },
});

export const Upload = asNexusMethod(GraphQLUpload, 'upload');

export const CSVImportInput = inputObjectType({
  name: 'CSVImportInput',
  definition: (t) => {
    t.nonNull.string('zoneId');
    t.nonNull.field('file', { type: 'Upload' });
  },
});

export const CSVImport = objectType({
  name: 'CSVImport',
  definition(t) {
    t.boolean('isOk');
  },
});

export const CSVImportMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.field('importCSV', {
      type: CSVImport,
      args: {
        input: arg({ type: nonNull(CSVImportInput) }),
      },
      resolve: async (_, { input }, { prisma, tenantId }) => {
        const { zoneId, file } = input;
        const { createReadStream, mimetype } = await file;
        const nativeZoneId = fromGraphId('Zone', zoneId);

        if (mimetype !== 'text/csv') {
          throw new Error(`Invalid file type: ${mimetype}.`);
        }

        const stream: Stream = createReadStream();

        const parser = stream.pipe(csvParse());
        const [header, ...records] = await CSVParserToPromise(parser);
        if (!isHeaderValid(header)) {
          throw new Error('Incorrect CSV values.');
        }
        const deviceList = CSVValuesToJSON(records);
        const blueprints = await prisma.blueprint.findMany();
        await prisma.device.createMany({
          data: deviceList.map((dev) => {
            const matchingBlueprint = blueprints.find(
              (bp) => bp.name === `${dev.device_type}_${dev.version}_${dev.port_number}`,
            );
            const trimmedTemplate = matchingBlueprint?.template.trim() ?? '{}';
            const parsedTemplate = jsonParse(trimmedTemplate);
            return {
              name: dev.node_id,
              tenantId,
              source: 'IMPORTED' as const,
              uniconfigZoneId: nativeZoneId,
              managementIp: dev.ip_address,
              port: dev.port_number,
              software: dev.device_type,
              version: dev.version,
              mountParameters: JSON.parse(parsedTemplate(dev)),
            };
          }),
        });

        return { isOk: true };
      },
    });
  },
});

export const UniconfigShell = extendType({
  type: 'Subscription',
  definition: (t) => {
    t.string('uniconfigShell', {
      args: {
        input: nullable(stringArg()),
        // this is kind of an ugly hack, so we can send send the same character in sequence
        // this is due to the nature of React render cycle - a === a, more info in the frontend project
        trigger: intArg(),
        sessionId: nonNull(stringArg()),
      },
      subscribe: (_, args) => sshClient.initSSH(args.sessionId, args.input ?? null),
      resolve: (eventData) => eventData.toString(),
    });
  },
});

export const UniconfigShellSession = extendType({
  type: 'Query',
  definition: (t) => {
    t.string('uniconfigShellSession', {
      resolve: async () => {
        const id = uuid();
        await sshClient.prepareShell(id);
        return id;
      },
    });
  },
});

export const BulkInstallDevicePayload = objectType({
  name: 'BulkInstallDevicePayload',
  definition: (t) => {
    t.nonNull.list.nonNull.field('installedDevices', { type: Device });
  },
});

export const BulkInstallDevicesInput = inputObjectType({
  name: 'BulkInstallDevicesInput',
  definition: (t) => {
    t.nonNull.list.nonNull.string('deviceIds');
  },
});

export const BulkInstallDevicesMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('bulkInstallDevices', {
      type: BulkInstallDevicePayload,
      args: {
        input: nonNull(arg({ type: BulkInstallDevicesInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { deviceIds } = args.input;
        const nativeIds = deviceIds.map((id) => fromGraphId('Device', id));
        const devices = await prisma.device.findMany({ where: { id: { in: nativeIds }, tenantId } });
        const zonesWithDevices = makeZonesWithDevicesFromDevices(devices);

        const devicesToInstallWithParams = [...zonesWithDevices.entries()].map(
          ([uniconfigZoneId, devicesToInstall]) => ({
            uniconfigURL: getUniconfigURL(prisma, uniconfigZoneId),
            devicesToInstall: prepareMultipleInstallParameters(devicesToInstall),
            deviceNames: devicesToInstall.map((device) => device.deviceName),
          }),
        );

        try {
          await Promise.all(
            devicesToInstallWithParams.map((devicesToInstall) => installMultipleDevicesCache(devicesToInstall)),
          );
        } catch (e) {
          if (e instanceof ExternalApiError) {
            throw new Error(e.getErrorMessage());
          }
        }

        return { installedDevices: devices };
      },
    });
  },
});

export const BulkUninstallDevicePayload = objectType({
  name: 'BulkUninstallDevicePayload',
  definition: (t) => {
    t.nonNull.list.nonNull.field('uninstalledDevices', { type: Device });
  },
});

export const BulkUninstallDevicesInput = inputObjectType({
  name: 'BulkUninstallDevicesInput',
  definition: (t) => {
    t.nonNull.list.nonNull.string('deviceIds');
  },
});

export const BulkUninstallDevicesMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('bulkUninstallDevices', {
      type: BulkUninstallDevicePayload,
      args: {
        input: nonNull(arg({ type: BulkUninstallDevicesInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { deviceIds } = args.input;
        const nativeIds = deviceIds.map((id) => fromGraphId('Device', id));
        const devices = await prisma.device.findMany({ where: { id: { in: nativeIds }, tenantId } });
        const zonesWithDevices = makeZonesWithDevicesFromDevices(devices);

        const devicesToUninstallWithParams = [...zonesWithDevices.entries()].map(
          ([uniconfigZoneId, devicesToUninstall]) => ({
            uniconfigURL: getUniconfigURL(prisma, uniconfigZoneId),
            devicesToUninstall: {
              input: {
                nodes: devicesToUninstall.map(({ deviceName, params }) => ({
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'node-id': deviceName,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'connection-type': getConnectionType(decodeMountParams(params)),
                })),
              },
            },
            deviceNames: devicesToUninstall.map((device) => device.deviceName),
          }),
        );

        await Promise.all(
          devicesToUninstallWithParams.map((devicesToUninstall) => uninstallMultipleDevicesCache(devicesToUninstall)),
        );

        return { uninstalledDevices: devices };
      },
    });
  },
});
