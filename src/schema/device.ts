import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { parse as csvParse } from 'csv-parse';
import { GraphQLUpload } from 'graphql-upload';
import jsonParse from 'json-templates';
import { arg, asNexusMethod, enumType, extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import { Stream } from 'node:stream';
import { decodeMetadataOutput } from '../helpers/device-types';
import {
  getCachedDeviceInstallStatus,
  installDeviceCache,
  uninstallDeviceCache,
} from '../external-api/uniconfig-cache';
import { decodeMountParams, getConnectionType, prepareInstallParameters } from '../helpers/converters';
import { getFilterQuery, getOrderingQuery, updateMetadataWithPosition } from '../helpers/device-helpers';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { CSVParserToPromise, CSVValuesToJSON, isHeaderValid } from '../helpers/import-csv.helpers';
import { getUniconfigURL } from '../helpers/zone.helpers';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { LabelConnection } from './label';
import { Location } from './location';
import { Zone } from './zone';
import unwrap from '../helpers/unwrap';
import { Blueprint } from './blueprint';

export const DeviceServiceState = enumType({
  name: 'DeviceServiceState',
  members: ['PLANNING', 'IN_SERVICE', 'OUT_OF_SERVICE'],
});
export const DeviceSource = enumType({
  name: 'DeviceSource',
  members: ['MANUAL', 'DISCOVERED', 'IMPORTED'],
});

export const Position = objectType({
  name: 'Position',
  definition: (t) => {
    t.nonNull.float('x');
    t.nonNull.float('y');
  },
});

export const PositionInputField = inputObjectType({
  name: 'PositionInputField',
  definition: (t) => {
    t.nonNull.float('x');
    t.nonNull.float('y');
  },
});

export const PositionInput = inputObjectType({
  name: 'PositionInput',
  definition: (t) => {
    t.nonNull.id('deviceId');
    t.nonNull.field('position', {
      type: PositionInputField,
    });
  },
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
    t.string('address', {
      resolve: async (root) => {
        return root.managementIp;
      },
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
        const uniconfigURL = await getUniconfigURL(prisma, uniconfigZoneId);
        const isInstalled = await getCachedDeviceInstallStatus(uniconfigURL, root.name);
        return isInstalled;
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
    t.field('position', {
      type: Position,
      resolve: async (device) => {
        const { metadata } = device;
        const position = decodeMetadataOutput(metadata)?.position || null;
        return position;
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
  members: ['NAME', 'CREATED_AT'],
});
export const SortDirection = enumType({
  name: 'SortDirection',
  members: ['ASC', 'DESC'],
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
            username: input.username,
            password: input.password,
            port: input.port ?? undefined,
            deviceType: input.deviceType,
            version: input.version,
            mountParameters: input.mountParameters != null ? JSON.parse(input.mountParameters) : undefined,
            source: 'MANUAL',
            serviceState: input.serviceState ?? undefined,
            blueprintId: input.blueprintId ?? undefined,
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
    t.string('blueprintId');
    t.string('model');
    t.string('vendor');
    t.string('address');
    t.string('username');
    t.string('password');
    t.int('port');
    t.string('deviceType');
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
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeId = fromGraphId('Device', args.id);
        const dbDevice = await prisma.device.findFirst({
          where: { id: nativeId, tenantId },
        });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const isInstalled = await getCachedDeviceInstallStatus(uniconfigURL, dbDevice.name);
        if (isInstalled) {
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
            deviceType: input.deviceType,
            version: input.version,
            username: input.username,
            password: input.password,
            port: input.port,
            serviceState: input.serviceState ?? undefined,
            location: input.locationId ? { connect: { id: fromGraphId('Location', input.locationId) } } : undefined,
            blueprint: input.blueprintId ? { connect: { id: fromGraphId('Blueprint', input.blueprintId) } } : undefined,
          },
        });
        return { device: updatedDevice };
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

export const UpdateDeviceMetadataMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateDeviceMetadata', {
      type: UpdateDeviceMetadataPayload,
      args: {
        input: nonNull(list(nonNull(PositionInput))),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { input } = args;

        const positionsMap = new Map(
          input.map((item) => {
            const nativeId = fromGraphId('Device', item.deviceId);
            return [nativeId, item];
          }),
        );

        const dbDevices = await prisma.device.findMany({
          where: { id: { in: [...positionsMap.keys()] }, tenantId },
        });

        const updatedPromises = dbDevices.map((device) => {
          const oldMetadata = decodeMetadataOutput(device.metadata);
          const newPosition = unwrap(positionsMap.get(device.id)).position;
          const newMetadata = updateMetadataWithPosition(oldMetadata || null, newPosition);

          return prisma.device.update({
            where: { id: device.id },
            data: {
              metadata: newMetadata,
            },
          });
        });

        const updatedDevices = await Promise.all(updatedPromises);

        return {
          devices: updatedDevices,
        };
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
      resolve: async (_, args, { prisma, tenantId }) => {
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
        await installDeviceCache({ uniconfigURL, deviceName: device.name, params: installDeviceParams });
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
        await uninstallDeviceCache({ uniconfigURL, params: uninstallParams, deviceName: device.name });
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
              softwareVersion: dev.version,
              // we do this to remove whitespace
              mountParameters: JSON.stringify(JSON.parse(parsedTemplate(dev))),
            };
          }),
        });

        return { isOk: true };
      },
    });
  },
});
