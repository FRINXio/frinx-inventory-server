import { PrismaClient } from '@prisma/client';
import { fromGraphId } from './id-helper';
import { omitNullValue } from './utils.helpers';
import { getUniconfigURL } from './zone.helpers';
import { getConnectionType, decodeMountParams, prepareMultipleInstallParameters } from './converters';

type FilterInput = {
  labelIds?: string[] | null;
  deviceName?: string | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
  name?: Record<string, unknown>;
};

type OrderingInput = {
  sortKey: 'name' | 'createdAt' | 'serviceState';
  direction: 'ASC' | 'DESC';
};

function getLabelsQuery(labelIds: string[]): Record<string, unknown> | undefined {
  return labelIds.length ? { some: { labelId: { in: labelIds } } } : undefined;
}

function getDeviceNameQuery(deviceName?: string | null): Record<string, unknown> | undefined {
  return deviceName ? { contains: deviceName, mode: 'insensitive' } : undefined;
}

export function getFilterQuery(filter?: FilterInput | null): FilterQuery | undefined {
  if (!filter) {
    return undefined;
  }
  const { labelIds, deviceName } = filter;
  return {
    label: getLabelsQuery(labelIds ?? []),
    name: getDeviceNameQuery(deviceName),
  };
}

export function getOrderingQuery(ordering?: OrderingInput | null): Record<string, unknown> | undefined {
  return ordering
    ? {
        orderBy: [{ [ordering.sortKey]: ordering.direction.toLowerCase() }],
      }
    : undefined;
}

type DeviceBulkOperationInput = {
  zoneId: string;
  deviceIds: string[];
};

async function makeZonesWithDevicesFromBulkOperationInput(
  devicesBulk: DeviceBulkOperationInput[],
  tenantId: string,
  prisma: PrismaClient,
) {
  const devicesWithNativeIds = devicesBulk.map((devices) => ({
    ...devices,
    deviceIds: devices.deviceIds.map((deviceId) => fromGraphId('Device', deviceId)),
  }));

  const nativeIds = devicesWithNativeIds.flatMap((devices) => devices.deviceIds);
  const devices = await prisma.device.findMany({
    where: { id: { in: nativeIds }, AND: { tenantId } },
  });

  if (devices == null || devices.length === 0) {
    throw new Error('device not found');
  }

  return devicesWithNativeIds.map((devs) => ({
    ...devs,
    devices: devs.deviceIds.map((deviceId) => devices.find((device) => device.id === deviceId)).filter(omitNullValue),
  }));
}

export async function prepareDevicesForBulkUninstall(
  devicesBulk: DeviceBulkOperationInput[],
  tenantId: string,
  prisma: PrismaClient,
) {
  const zonesWithDevices = await makeZonesWithDevicesFromBulkOperationInput(devicesBulk, tenantId, prisma);

  const devicesToUninstallWithParams = await Promise.all(
    zonesWithDevices.map(async (zone) => {
      const uniconfigURL = await getUniconfigURL(prisma, fromGraphId('Zone', zone.zoneId));
      const deviceNames = zone.devices.map((device) => device.name);
      const params = zone.devices.map((device) => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'node-id': device.name,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'connection-type': getConnectionType(decodeMountParams(device.mountParameters)),
      }));

      return { uniconfigURL, deviceNames, params: { input: { nodes: params } } };
    }),
  );

  return {
    devicesToUninstallWithParams,
    devices: zonesWithDevices.flatMap((zone) => zone.devices),
  };
}

export async function prepareDevicesForBulkInstall(
  devicesBulk: DeviceBulkOperationInput[],
  tenantId: string,
  prisma: PrismaClient,
) {
  const zonesWithDevices = await makeZonesWithDevicesFromBulkOperationInput(devicesBulk, tenantId, prisma);

  const devicesToInstallWithParams = await Promise.all(
    zonesWithDevices.map(async (zone) => {
      const uniconfigURL = await getUniconfigURL(prisma, fromGraphId('Zone', zone.zoneId));
      const deviceNames = zone.devices.map((device) => device.name);
      const params = prepareMultipleInstallParameters(
        deviceNames,
        zone.devices.map((device) => device.mountParameters),
      );

      return { uniconfigURL, deviceNames, params };
    }),
  );

  return {
    devicesToInstallWithParams,
    devices: zonesWithDevices.flatMap((zone) => zone.devices),
  };
}
