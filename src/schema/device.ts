import { connectionFromArray } from 'graphql-relay';
import { arg, enumType, extendType, inputObjectType, intArg, nonNull, objectType, stringArg } from 'nexus';
import {
  getDeviceInstallConverter,
  convertDBDevice,
  convertDBZone,
  decodeMountParams,
  getConnectionType,
  prepareInstallParameters,
  dropNulls,
  convertDBLabel,
  convertDBLocation,
} from '../helpers/converters';
import { fromGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';
import { Node, PageInfo } from './global-types';
import { LabelConnection } from './label';
import { Location } from './location';
import { Zone } from './zone';

export const DeviceServiceState = enumType({
  name: 'DeviceServiceState',
  members: ['PLANNING', 'IN_SERVICE', 'OUT_OF_SERVICE'],
});
export const DeviceSource = enumType({
  name: 'DeviceSource',
  members: ['MANUAL', 'DISCOVERED', 'IMPORTED'],
});
export const Device = objectType({
  name: 'Device',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.string('name');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
    t.string('model');
    t.string('vendor');
    t.string('address');
    t.nonNull.field('source', { type: DeviceSource });
    t.nonNull.field('serviceState', { type: DeviceServiceState });
    t.nonNull.boolean('isInstalled', {
      resolve: async (root, _, { uniconfigAPI, prisma }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { $zoneId } = root;
        const uniconfigURL = await makeUniconfigURL(prisma, $zoneId);
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        return installedDevices.some((name) => root.name === name);
      },
    });
    t.nonNull.field('zone', {
      type: Zone,
      resolve: async (root, _, { prisma }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { $zoneId } = root;
        if ($zoneId == null) {
          throw new Error('should never happen');
        }
        const zone = await prisma.uniconfigZone.findFirst({ where: { id: $zoneId } });
        if (zone == null) {
          throw new Error('should never happen');
        }
        return convertDBZone(zone);
      },
    });
    t.nonNull.field('labels', {
      type: LabelConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: async (root, args, { prisma, tenantId }) => {
        const nativeDeviceId = fromGraphId('Device', root.id);
        const dbLabels = await prisma.label.findMany({
          where: { tenantId, AND: { device: { every: { deviceId: nativeDeviceId } } } },
        });
        const labels = dbLabels.map(convertDBLabel);
        return connectionFromArray(labels, args);
      },
    });
    t.field('location', {
      type: Location,
      resolve: async (root, _, { prisma }) => {
        const nativeDeviceId = fromGraphId('Device', root.id);
        const dbLocation = await prisma.device.findFirst({ where: { id: nativeDeviceId } }).location();
        if (dbLocation == null) {
          return null;
        }
        return convertDBLocation(dbLocation);
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
  },
});
export const FilterDevicesInput = inputObjectType({
  name: 'FilterDevicesInput',
  definition: (t) => {
    t.list.nonNull.string('labelIds');
  },
});
export const DevicesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('devices', {
      type: DeviceConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
        filter: FilterDevicesInput,
      },
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const { filter } = args;
        const labelIds = (filter?.labelIds ?? []).map((lId) => fromGraphId('Label', lId));
        const filterQuery = labelIds.length ? { label: { every: { labelId: { in: labelIds } } } } : {};
        const dbDevices = await prisma.device.findMany({
          where: { tenantId, ...filterQuery },
        });
        const zoneIds = [...new Set(dropNulls(dbDevices.map((d) => d.uniconfigZoneId)))];
        const uniconfigURLs = await Promise.all(zoneIds.map((zId) => makeUniconfigURL(prisma, zId)));
        const apiResults = await Promise.all(
          dropNulls(uniconfigURLs).map((url) => uniconfigAPI.getInstalledDevices(url)),
        );
        const installedDevices = apiResults.map((r) => r.output.nodes ?? []).flat();
        const devices = dbDevices.map(convertDBDevice);
        const addInstallStatus = getDeviceInstallConverter(installedDevices);
        return connectionFromArray(devices.map(addInstallStatus), args);
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
    t.field('serviceState', { type: DeviceServiceState });
    t.string('mountParameters');
    t.string('model');
    t.string('vendor');
    t.string('address');
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
      resolve: async (_, args, { prisma, tenantId }) => {
        const { input } = args;
        const zone = await prisma.uniconfigZone.findFirst({ where: { tenantId } });
        if (zone == null) {
          throw new Error('zone not found');
        }
        const nativeZoneId = fromGraphId('Zone', input.zoneId);
        const labelIds = input.labelIds ? [...new Set(input.labelIds)] : null;
        const device = await prisma.device.create({
          data: {
            name: input.name,
            uniconfigZoneId: nativeZoneId,
            tenantId,
            model: input.model,
            vendor: input.vendor,
            managementIp: input.address,
            mountParameters: input.mountParameters != null ? JSON.parse(input.mountParameters) : undefined,
            source: 'MANUAL',
            serviceState: input.serviceState ?? undefined,
            label: labelIds
              ? { createMany: { data: labelIds.map((id) => ({ labelId: fromGraphId('Label', id) })) } }
              : undefined,
          },
        });

        return { device: convertDBDevice(device) };
      },
    });
  },
});

export const UpdateDeviceInput = inputObjectType({
  name: 'UpdateDeviceInput',
  definition: (t) => {
    t.string('mountParameters');
    t.string('model');
    t.string('vendor');
    t.string('address');
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
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { id: nativeId, AND: { tenantId } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        if (installedDevices.some((name) => dbDevice.name === name)) {
          throw new Error('device is installed in UniConfig');
        }
        const { input } = args;
        const deviceMountParameters =
          input.mountParameters != null ? JSON.parse(input.mountParameters) : input.mountParameters;
        const labelIds = input.labelIds ?? [];

        await prisma.$transaction([
          prisma.deviceLabel.deleteMany({ where: { deviceId: nativeId } }),
          prisma.deviceLabel.createMany({
            data: labelIds.map((lId) => ({ labelId: fromGraphId('Label', lId), deviceId: nativeId })),
          }),
        ]);
        const updatedDevice = await prisma.device.update({
          where: { id: nativeId },
          data: {
            model: input.model,
            vendor: input.vendor,
            managementIp: input.address,
            mountParameters: deviceMountParameters,
            serviceState: input.serviceState ?? undefined,
            location: input.locationId ? { connect: { id: fromGraphId('Location', input.locationId) } } : undefined,
          },
        });
        return { device: convertDBDevice(updatedDevice) };
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
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        if (installedDevices.some((name) => dbDevice.name === name)) {
          throw new Error('device is installed in UniConfig');
        }
        const deletedDevice = await prisma.device.delete({ where: { id: nativeId } });
        return { device: convertDBDevice(deletedDevice) };
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
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const { mountParameters } = dbDevice;
        const installDeviceParams = prepareInstallParameters(dbDevice.name, mountParameters);
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        await uniconfigAPI.installDevice(uniconfigURL, installDeviceParams);
        const device = convertDBDevice(dbDevice);

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
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }

        const uninstallParams = {
          input: {
            'node-id': dbDevice.name,
            'connection-type': getConnectionType(decodeMountParams(dbDevice.mountParameters)),
          },
        };
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        await uniconfigAPI.uninstallDevice(uniconfigURL, uninstallParams);

        const device = convertDBDevice(dbDevice);

        return { device };
      },
    });
  },
});
