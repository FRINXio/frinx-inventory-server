import { Prisma } from '@prisma/client';
import { Device } from '../schema/source-types';
import { decodeMetadataOutput } from './device-types';

type FilterInput = {
  labelIds?: string[] | null;
  deviceName?: string | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
  name?: Record<string, unknown>;
};

type DeviceOrderingInput = {
  sortKey: 'name' | 'createdAt' | 'serviceState';
  direction: 'ASC' | 'DESC';
};

type StreamOrderingInput = {
  sortKey: 'streamName' | 'createdAt';
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

export function getOrderingQuery(
  ordering?: StreamOrderingInput | DeviceOrderingInput | null,
): Record<string, unknown> | undefined {
  return ordering
    ? {
        orderBy: [{ [ordering.sortKey]: ordering.direction.toLowerCase() }],
      }
    : undefined;
}

export function getStreamOrderingQuery(ordering?: StreamOrderingInput | null): Record<string, unknown> | undefined {
  return ordering
    ? {
        orderBy: [{ [ordering.sortKey]: ordering.direction.toLowerCase() }],
      }
    : undefined;
}

export function makeZonesWithDevicesFromDevices(devices: Device[]) {
  const zonesWithDevices = new Map<
    string,
    {
      deviceName: string;
      params: Prisma.JsonValue;
    }[]
  >();

  devices.forEach((device) => {
    const devicesInZone = zonesWithDevices.get(device.uniconfigZoneId) ?? [];

    const deviceToInstall = {
      deviceName: device.name,
      params: device.mountParameters,
    };

    zonesWithDevices.set(device.uniconfigZoneId, [...devicesInZone, deviceToInstall]);
  });

  return zonesWithDevices;
}

type DeviceLocation = {
  type: 'Point';
  coordinates: [number, number];
};

export function encodeDeviceForInventoryKafka(
  device: Device,
  deviceLocation: DeviceLocation,
  deviceLabelsIds: string[] = [],
) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_name: device.name,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_size: decodeMetadataOutput(device.metadata)?.deviceSize ?? 'MEDIUM',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_type: device.deviceType,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_address: device.macAddress,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_port: device.port,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    zone_id: device.uniconfigZoneId,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    service_state: device.serviceState,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    mount_parameters: device.mountParameters,
    vendor: device.vendor,
    model: device.model,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    blueprint_id: device.blueprintId,
    username: device.username,
    password: device.password,
    version: device.version,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    labels_ids: deviceLabelsIds,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    geo_location: deviceLocation,
  };
}
