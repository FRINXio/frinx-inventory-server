<<<<<<< HEAD
import { sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';
import {
  decodeInstalledDevicesOutput,
  decodeUniconfigCommitOutput,
  decodeUniconfigConfigOutput,
  InstalledDevicesOutput,
  UniconfigCommitInput,
  UniconfigCommitOutput,
  UniconfigConfigInput,
=======
import { sendGetRequest, sendPostRequest } from './helpers';
import {
  decodeInstalledDevicesOutput,
  decodeUniconfigConfigOutput,
  InstalledDevicesOutput,
>>>>>>> origin/master
  UniconfigConfigOutput,
  UninstallDeviceInput,
} from './network-types';

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

export type DataStoreOptions = {
  nodeId: string;
  datastoreType: 'operational' | 'config';
};

const DATA_STORE_MAP = {
  operational: 'nonconfig',
  config: 'config',
};

export async function getUniconfigDatastore(
  baseURL: string,
  options: DataStoreOptions,
): Promise<UniconfigConfigOutput> {
  const { nodeId, datastoreType } = options;
  const json = await sendGetRequest([
    baseURL,
    `/data/network-topology:network-topology/network-topology:topology=uniconfig/network-topology:node=${nodeId}/frinx-uniconfig-topology:configuration?content=${DATA_STORE_MAP[datastoreType]}`,
  ]);
  const data = decodeUniconfigConfigOutput(json);

  return data;
}

export async function updateUniconfigDataStore(
  baseURL: string,
  nodeId: string,
  params: UniconfigConfigInput,
): Promise<void> {
  await sendPutRequest(
    [
      baseURL,
      `/data/network-topology:network-topology/network-topology:topology=uniconfig/network-topology:node=${nodeId}/frinx-uniconfig-topology:configuration`,
    ],
    params,
  );
}

export async function postCommitToNetwork(
  baseURL: string,
  params: UniconfigCommitInput,
): Promise<UniconfigCommitOutput> {
  const json = await sendPostRequest([baseURL, '/operations/uniconfig-manager:commit'], params);
  const data = decodeUniconfigCommitOutput(json);

  return data;
}

export type UniConfigAPI = {
  getInstalledDevices: (baseURL: string) => Promise<InstalledDevicesOutput>;
  installDevice: (baseURL: string, params: unknown) => Promise<void>;
  uninstallDevice: (baseURL: string, params: UninstallDeviceInput) => Promise<void>;
  getUniconfigDatastore: (baseURL: string, options: DataStoreOptions) => Promise<UniconfigConfigOutput>;
  updateUniconfigDataStore: (baseURL: string, nodeId: string, params: UniconfigConfigInput) => Promise<void>;
  postCommitToNetwork: (baseURL: string, params: UniconfigCommitInput) => Promise<UniconfigCommitOutput>;
};

const uniconfigAPI: UniConfigAPI = {
  getInstalledDevices,
  installDevice,
  uninstallDevice,
  getUniconfigDatastore,
  updateUniconfigDataStore,
  postCommitToNetwork,
};

export default uniconfigAPI;
