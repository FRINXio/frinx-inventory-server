import { Prisma } from '@prisma/client';
import { Either, fold } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

export function extractResult<A>(result: Either<t.Errors, A>): A {
  return fold(
    () => {
      const errorMessages = PathReporter.report(result);
      throw new Error(`BAD_REQUEST: ${errorMessages}`);
    },
    (data: A) => data,
  )(result);
}

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

export function prepareInstallParameters(deviceName: string, mountParameters: Prisma.JsonValue): Prisma.JsonValue {
  return {
    input: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'node-id': deviceName,
      ...(mountParameters as Record<string, unknown>),
    },
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
