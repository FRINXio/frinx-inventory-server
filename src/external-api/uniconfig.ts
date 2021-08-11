import { sendPostRequest } from './helpers';
import { decodeInstalledDevicesOutput, InstalledDevicesOutput, UninstallDeviceInput } from './network-types';

export async function getInstalledDevices(baseURL: string): Promise<InstalledDevicesOutput> {
  const json = await sendPostRequest([baseURL, '/operations/connection-manager:get-installed-nodes']);
  const data = decodeInstalledDevicesOutput(json);

  return data;
}

export async function installDevice(baseURL: string, params: unknown): Promise<void> {
  await sendPostRequest([baseURL, '/operations/connection-manager:install-node'], params);
}

export async function uninstallDevice(baseURL: string, params: UninstallDeviceInput): Promise<void> {
  await sendPostRequest([baseURL, '/operations/connection-manager:uninstall-node'], params);
}

export type UniConfigAPI = {
  getInstalledDevices: (baseURL: string) => Promise<InstalledDevicesOutput>;
  installDevice: (baseURL: string, params: unknown) => Promise<void>;
  uninstallDevice: (baseURL: string, params: UninstallDeviceInput) => Promise<void>;
};

const uniconfigAPI: UniConfigAPI = {
  getInstalledDevices,
  installDevice,
  uninstallDevice,
};

export default uniconfigAPI;
