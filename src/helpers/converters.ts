import * as t from 'io-ts';
import { Either, fold } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { device as DbDevice, Prisma, uniconfigZone as DbUniconfigZone, label as DbLabel } from '@prisma/client';
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
  createdAt: string;
  updatedAt: string;
  mountParameters: string | null;
  model: string | null;
  vendor: string | null;
  address: string | null;
  installationStatus: 'INSTALLED' | 'NOT_INSTALLED' | null;
  source: 'MANUAL' | 'DISCOVERED' | 'IMPORTED';
  $zoneId: string;
};

export function convertDBDevice(dbDevice: DbDevice): DeviceType {
  const deviceMountParameters = dbDevice.mountParameters != null ? JSON.stringify(dbDevice.mountParameters) : null;
  return {
    id: toGraphId('Device', dbDevice.id),
    name: dbDevice.name,
    createdAt: dbDevice.createdAt.toISOString(),
    updatedAt: dbDevice.updatedAt.toISOString(),
    mountParameters: deviceMountParameters,
    model: dbDevice.model,
    vendor: dbDevice.vendor,
    installationStatus: null,
    address: dbDevice.managementIp,
    source: dbDevice.source,
    $zoneId: dbDevice.uniconfigZoneId,
  };
}

export type ZoneType = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function convertDBZone(dbZone: DbUniconfigZone): ZoneType {
  return {
    id: toGraphId('Zone', dbZone.id),
    name: dbZone.name,
    createdAt: dbZone.createdAt.toISOString(),
    updatedAt: dbZone.updatedAt.toISOString(),
  };
}

export type LabelType = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function convertDBLabel(dbLabel: DbLabel): LabelType {
  return {
    id: toGraphId('Label', dbLabel.id),
    name: dbLabel.name,
    createdAt: dbLabel.createdAt.toISOString(),
    updatedAt: dbLabel.updatedAt.toISOString(),
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

export function dropNulls<T>(values: (T | null)[]): T[] {
  const result: T[] = [];
  values.forEach((v) => {
    if (v !== null) {
      result.push(v);
    }
  });
  return result;
}
