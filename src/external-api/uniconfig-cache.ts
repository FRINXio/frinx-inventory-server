import urlJoin from 'url-join';
import { UninstallDeviceInput } from './network-types';
import { getCheckInstalledDevices, installDevice, uninstallDevice } from './uniconfig';

export class UniconfigCache {
  private static instance: UniconfigCache;

  private _cache: Map<string, boolean> = new Map();

  public static getInstance(): UniconfigCache {
    if (!UniconfigCache.instance) {
      UniconfigCache.instance = new UniconfigCache();
    }

    return UniconfigCache.instance;
  }

  private static _makeKey(baseURL: string, deviceName: string): string {
    return urlJoin(baseURL, deviceName);
  }

  get(baseURL: string, deviceName: string): boolean | undefined {
    return this._cache.get(UniconfigCache._makeKey(baseURL, deviceName));
  }

  clear(): void {
    return this._cache.clear();
  }

  delete(baseURL: string, deviceName: string): boolean {
    return this._cache.delete(UniconfigCache._makeKey(baseURL, deviceName));
  }

  set(baseURL: string, deviceName: string, value: boolean): Map<string, boolean> {
    return this._cache.set(UniconfigCache._makeKey(baseURL, deviceName), value);
  }
}

async function getDeviceInstallStatus(baseURL: string, deviceName: string): Promise<boolean> {
  const input = {
    input: {
      'target-nodes': { node: [deviceName] },
    },
  };
  const { output } = await getCheckInstalledDevices(baseURL, input);

  return output.nodes?.includes(deviceName) ?? false;
}

const uniconfigCache = UniconfigCache.getInstance();

export async function getCachedDeviceInstallStatus(baseURL: string, deviceName: string): Promise<boolean> {
  let deviceInstallStatus = uniconfigCache.get(baseURL, deviceName);

  if (deviceInstallStatus == null) {
    deviceInstallStatus = await getDeviceInstallStatus(baseURL, deviceName);
    uniconfigCache.set(baseURL, deviceName, deviceInstallStatus);
  }
  return deviceInstallStatus;
}

export type CacheInstallDeviceParams = {
  uniconfigURL: string;
  params: unknown;
  deviceName: string;
};

export async function installDeviceCache({
  uniconfigURL,
  deviceName,
  params,
}: CacheInstallDeviceParams): Promise<void> {
  const response = await installDevice(uniconfigURL, params);
  if (response.output.status === 'fail') {
    throw new Error(response.output['error-message'] ?? 'could not install device');
  }
  uniconfigCache.delete(uniconfigURL, deviceName);
}

export type CacheUninstallDeviceParams = {
  uniconfigURL: string;
  params: UninstallDeviceInput;
  deviceName: string;
};

export async function uninstallDeviceCache({
  uniconfigURL,
  params,
  deviceName,
}: CacheUninstallDeviceParams): Promise<void> {
  await uninstallDevice(uniconfigURL, params);
  uniconfigCache.delete(uniconfigURL, deviceName);
}
