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
} from '../helpers/converters';
import { fromGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';
import { Node, PageInfo } from './global-types';
import { Zone } from './zone';

export const DeviceStatus = enumType({
  name: 'DeviceStatus',
  members: ['INSTALLED', 'NOT_INSTALLED'],
});
export const Device = objectType({
  name: 'Device',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.string('name');
    t.string('model');
    t.string('vendor');
    t.string('address');
    t.field('status', {
      type: DeviceStatus,
      resolve: async (root, _, { uniconfigAPI, prisma }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { $zoneId } = root;
        const uniconfigURL = await makeUniconfigURL(prisma, $zoneId);
        if (uniconfigURL == null) {
          return null;
        }
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        return installedDevices.some((name) => root.name === name) ? 'INSTALLED' : 'NOT_INSTALLED';
      },
    });
    t.field('zone', {
      type: Zone,
      resolve: async (root, _, { prisma }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { $zoneId } = root;
        if ($zoneId == null) {
          return null;
        }
        const zone = await prisma.uniconfig_zones.findFirst({ where: { id: $zoneId } });
        if (zone == null) {
          return null;
        }
        return convertDBZone(zone);
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
export const DevicesConnection = objectType({
  name: 'DevicesConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: DeviceEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
  },
});
export const DevicesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('devices', {
      type: DevicesConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const dbDevices = await prisma.device_inventory.findMany({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { uniconfig_zones: { tenant_id: tenantId } },
        });
        const zoneIds = [...new Set(dropNulls(dbDevices.map((d) => d.uniconfig_zone)))];
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const zone = await prisma.uniconfig_zones.findFirst({ where: { tenant_id: tenantId } });
        if (zone == null) {
          throw new Error('zone not found');
        }
        const nativeZoneId = fromGraphId('Zone', input.zoneId);
        const device = await prisma.device_inventory.create({
          data: {
            name: input.name,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            uniconfig_zone: nativeZoneId,
            model: input.model,
            vendor: input.vendor,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            management_ip: input.address,
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
        const dbDevice = await prisma.device_inventory.findFirst({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { id: nativeId, AND: { uniconfig_zones: { tenant_id: tenantId } } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        if (installedDevices.some((name) => dbDevice.name === name)) {
          throw new Error('device is installed in UniConfig');
        }
        const { input } = args;
        const deviceMountParameters =
          input.mountParameters != null ? JSON.parse(input.mountParameters) : input.mountParameters;

        const updatedDevice = await prisma.device_inventory.update({
          where: { id: nativeId },
          data: {
            model: input.model,
            vendor: input.vendor,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            management_ip: input.address,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            mount_parameters: deviceMountParameters,
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
        const dbDevice = await prisma.device_inventory.findFirst({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { id: nativeId, AND: { uniconfig_zones: { tenant_id: tenantId } } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        if (installedDevices.some((name) => dbDevice.name === name)) {
          throw new Error('device is installed in UniConfig');
        }
        const deletedDevice = await prisma.device_inventory.delete({ where: { id: nativeId } });
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
        const dbDevice = await prisma.device_inventory.findFirst({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { id: nativeId, AND: { uniconfig_zones: { tenant_id: tenantId } } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { mount_parameters } = dbDevice;
        const installDeviceParams = prepareInstallParameters(dbDevice.name, mount_parameters);
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
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
        const dbDevice = await prisma.device_inventory.findFirst({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          where: { id: nativeId, AND: { uniconfig_zones: { tenant_id: tenantId } } },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }

        const uninstallParams = {
          input: {
            'node-id': dbDevice.name,
            'connection-type': getConnectionType(decodeMountParams(dbDevice.mount_parameters)),
          },
        };
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
        await uniconfigAPI.uninstallDevice(uniconfigURL, uninstallParams);

        const device = convertDBDevice(dbDevice);

        return { device };
      },
    });
  },
});
