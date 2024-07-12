import { JsonValue } from '@prisma/client/runtime/library';
import { decodeMountParams } from './converters';

export function getUniconfigStreamName(streamName: string, deviceName: string): string {
  return `${streamName}>>${deviceName}`;
}

function getDisabledSyncConfig() {
  return {
    'uniconfig-config:uniconfig-native-enabled': false, // eslint-disable-line @typescript-eslint/naming-convention
    'uniconfig-config:install-uniconfig-node-enabled': false, // eslint-disable-line @typescript-eslint/naming-convention
  };
}

export function getMountParamsForStream(mountParameters: JsonValue, streamParameters: JsonValue): JsonValue {
  const parsedStreamParameters = typeof streamParameters === 'string' ? JSON.parse(streamParameters) : streamParameters;
  const sanitizedStreamParameters = Array.isArray(parsedStreamParameters)
    ? parsedStreamParameters
    : [parsedStreamParameters];

  const decodedMountParams = decodeMountParams(mountParameters);

  if ('cli' in decodedMountParams) {
    const { cli } = decodedMountParams;
    return {
      cli: {
        ...cli,
        'subscriptions:stream': sanitizedStreamParameters, // eslint-disable-line @typescript-eslint/naming-convention
        ...getDisabledSyncConfig(),
      },
    };
  }

  if ('gnmi' in decodedMountParams) {
    const { gnmi } = decodedMountParams;
    return {
      gnmi: {
        ...gnmi,
        'subscriptions:stream': sanitizedStreamParameters, // eslint-disable-line @typescript-eslint/naming-convention
        ...getDisabledSyncConfig(),
      },
    };
  }

  const { netconf } = decodedMountParams;
  return {
    netconf: {
      ...netconf,
      'subscriptions:stream': sanitizedStreamParameters, // eslint-disable-line @typescript-eslint/naming-convention
      ...getDisabledSyncConfig(),
    },
  };
}

export function getStreamNameQuery(streamName?: string | null): Record<string, unknown> | undefined {
  return streamName ? { contains: streamName, mode: 'insensitive' } : undefined;
}
