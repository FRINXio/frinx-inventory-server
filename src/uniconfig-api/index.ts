import { sendPostRequest } from './helpers';
import { decodeInstalledDevicesOutput, InstalledDevicesOutput, UninstallDeviceInput } from './network-types';

export async function getInstalledDevices(): Promise<InstalledDevicesOutput> {
  const json = await sendPostRequest('/operations/connection-manager:get-installed-nodes');
  const data = decodeInstalledDevicesOutput(json);

  return data;
}

export async function installDevice(params: unknown): Promise<void> {
  await sendPostRequest('/operations/connection-manager:install-node', params);
}

export async function uninstallDevice(params: UninstallDeviceInput): Promise<void> {
  await sendPostRequest('/operations/connection-manager:uninstall-node', params);
}

export type UniConfigAPI = {
  getInstalledDevices: () => Promise<InstalledDevicesOutput>;
  installDevice: (params: unknown) => Promise<void>;
  uninstallDevice: (params: UninstallDeviceInput) => Promise<void>;
};

const uniconfigAPI: UniConfigAPI = {
  getInstalledDevices,
  installDevice,
  uninstallDevice,
};

export default uniconfigAPI;
