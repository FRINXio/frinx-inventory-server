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
  const parsedMountParameters = typeof mountParameters === 'string' ? JSON.parse(mountParameters) : mountParameters;
  const parsedStreamParameters = typeof streamParameters === 'string' ? JSON.parse(streamParameters) : streamParameters;

  const decodedMountParams = decodeMountParams(mountParameters);

  if ('cli' in decodedMountParams) {
    const { cli } = decodedMountParams;
    return {
      cli: {
        ...cli,
        ...parsedStreamParameters,
        ...getDisabledSyncConfig(),
      },
    };
  }

  if ('gnmi' in decodedMountParams) {
    const { gnmi } = decodedMountParams;
    return {
      gnmi: {
        ...gnmi,
        ...parsedStreamParameters,
        ...getDisabledSyncConfig(),
      },
    };
  }

  const { netconf } = decodedMountParams;
  return {
    netconf: {
      ...netconf,
      ...parsedMountParameters,
      ...getDisabledSyncConfig(),
    },
  };
}