import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, enumType, extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import { decodeMountParams, getConnectionType, prepareInstallParameters } from '../helpers/converters';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';
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
    t.string('model');
    t.string('vendor');
    t.string('address');
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
      resolve: async (root, _, { uniconfigAPI, prisma }) => {
        const { uniconfigZoneId } = root;
        const uniconfigURL = await makeUniconfigURL(prisma, uniconfigZoneId);
        const result = await uniconfigAPI.getInstalledDevices(uniconfigURL);
        const installedDevices = result.output.nodes ?? [];
        return installedDevices.some((name) => root.name === name);
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
    t.list.nonNull.string('labelIds');
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
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { filter } = args;
        const labelIds = (filter?.labelIds ?? []).map((lId) => fromGraphId('Label', lId));
        const filterQuery = labelIds.length ? { label: { some: { labelId: { in: labelIds } } } } : {};
        const baseArgs = { where: { tenantId, ...filterQuery } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.device.findMany({ ...baseArgs, ...paginationArgs }),
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
        const nativeZoneId = fromGraphId('Zone', input.zoneId);
        const zone = await prisma.uniconfigZone.findFirst({ where: { tenantId, id: nativeZoneId } });
        if (zone == null) {
          throw new Error('zone not found');
        }
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

        return { device };
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
          where: { id: nativeId, tenantId },
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
            data: labelIds.map((lId) => {
              const nativeLabelId = fromGraphId('Label', lId);
              return { labelId: nativeLabelId, deviceId: nativeId };
            }),
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
        return { device: updatedDevice };
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
        return { device: deletedDevice };
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
        const device = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (device == null) {
          throw new Error('device not found');
        }
        const { mountParameters } = device;
        const installDeviceParams = prepareInstallParameters(device.name, mountParameters);
        const uniconfigURL = await makeUniconfigURL(prisma, device.uniconfigZoneId);
        const response = await uniconfigAPI.installDevice(uniconfigURL, installDeviceParams);
        if (response.output.status === 'fail') {
          throw new Error(response.output['error-message'] ?? 'could not install device');
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
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const nativeId = fromGraphId('Device', args.id);
        const device = await prisma.device.findFirst({
          where: { id: nativeId, AND: { tenantId } },
        });
        if (device == null) {
          throw new Error('device not found');
        }

        const uninstallParams = {
          input: {
            'node-id': device.name,
            'connection-type': getConnectionType(decodeMountParams(device.mountParameters)),
          },
        };
        if (device == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, device.uniconfigZoneId);
        await uniconfigAPI.uninstallDevice(uniconfigURL, uninstallParams);

        return { device };
      },
    });
  },
});
