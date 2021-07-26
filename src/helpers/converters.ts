import * as t from 'io-ts';
import { Either, fold } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { device_inventory, Prisma, uniconfig_zones } from '@prisma/client';
import { toGraphId } from './id-helper';

export function extractResult<A>(result: Either<t.Errors, A>): A {
  return fold(
    () => {
      const errorMessages = PathReporter.report(result);
      throw new Error(`BAD_REQUEST: ${errorMessages}`);
    },
    (data: A) => data,
  )(result);
}

export type DeviceType = {
  id: string;
  name: string;
  mountParameters: string | null;
  model: string | null;
  vendor: string | null;
  address: string | null;
  installationStatus: 'INSTALLED' | 'NOT_INSTALLED' | null;
  $zoneId: number | null;
};

export function convertDBDevice(dbDevice: device_inventory): DeviceType {
  const deviceMountParameters = dbDevice.mount_parameters != null ? JSON.stringify(dbDevice.mount_parameters) : null;
  return {
    id: toGraphId('Device', dbDevice.id),
    name: dbDevice.name,
    mountParameters: deviceMountParameters,
    model: dbDevice.model,
    vendor: dbDevice.vendor,
    address: dbDevice.management_ip,
    installationStatus: null,
    $zoneId: dbDevice.uniconfig_zone,
  };
}

export type ZoneType = {
  id: string;
  name: string;
};

export function convertDBZone(dbZone: uniconfig_zones): ZoneType {
  return {
    id: toGraphId('Zone', dbZone.id),
    name: dbZone.name,
  };
}

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

export function prepareInstallParameters(deviceName: string, mountParameters: Prisma.JsonValue): Prisma.JsonValue {
  return {
    input: {
      'node-id': deviceName,
      ...(mountParameters as Record<string, unknown>),
    },
  };
}

export function getDeviceInstallConverter(deviceIds: string[]): (value: DeviceType) => DeviceType {
  return (dev) => {
    const { name, ...rest } = dev;
    return {
      name,
      ...rest,
      isInstalled: deviceIds.includes(name),
    };
  };
}

const MountParamsValidator = t.union([
  t.type({
    cli: t.unknown,
  }),
  t.type({
    netconf: t.unknown,
  }),
]);
type MountParams = t.TypeOf<typeof MountParamsValidator>;

export function decodeMountParams(value: unknown): MountParams {
  return extractResult(MountParamsValidator.decode(value));
}

export function getConnectionType(mountParameters: MountParams): 'cli' | 'netconf' {
  const type = Object.keys(mountParameters)[0];
  if (type !== 'cli' && type !== 'netconf') {
    throw new Error('INTERNAL SERVER ERROR');
  }
  return type;
}
