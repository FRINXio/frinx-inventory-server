import { sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';
import {
  decodeInstalledDevicesOutput,
  decodeUniconfigApplySnapshotOutput,
  decodeUniconfigCommitOutput,
  decodeUniconfigConfigOutput,
  decodeUniconfigDiffOuptut,
  decodeUniconfigReplaceOutput,
  decodeUniconfigSnapshotOutput,
  decodeUniconfigSnapshotsOutput,
  InstalledDevicesOutput,
  UniconfigApplySnapshotInput,
  UniconfigApplySnapshotOutput,
  UniconfigCommitInput,
  UniconfigCommitOutput,
  UniconfigConfigInput,
  UniconfigConfigOutput,
  UniconfigDiffInput,
  UniconfigDiffOutput,
  UniconfigReplaceInput,
  UniconfigReplaceOutput,
  UniconfigSnapshotInput,
  UniconfigSnapshotOutput,
  UniconfigSnapshotsOutput,
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

export async function postDryRunCommitToNetwork(
  baseURL: string,
  params: UniconfigCommitInput,
): Promise<UniconfigCommitOutput> {
  const json = await sendPostRequest([baseURL, '/operations/dryrun-manager:dryrun-commit'], params);
  const data = decodeUniconfigCommitOutput(json);

  return data;
}

export async function replaceConfig(baseURL: string, params: UniconfigReplaceInput): Promise<UniconfigReplaceOutput> {
  const json = await sendPostRequest(
    [baseURL, '/operations/uniconfig-manager:replace-config-with-operational'],
    params,
  );
  const data = decodeUniconfigReplaceOutput(json);

  return data;
}

export async function getSnapshots(baseURL: string): Promise<UniconfigSnapshotsOutput> {
  const json = await sendGetRequest([baseURL, '/data/snapshot-manager:snapshots-metadata?content=config']);
  const data = decodeUniconfigSnapshotsOutput(json);

  return data;
}

export async function createSnapshot(
  baseURL: string,
  params: UniconfigSnapshotInput,
): Promise<UniconfigSnapshotOutput> {
  const json = await sendPostRequest([baseURL, '/operations/snapshot-manager:create-snapshot'], params);
  const data = decodeUniconfigSnapshotOutput(json);

  return data;
}

export async function applySnapshot(
  baseURL: string,
  params: UniconfigApplySnapshotInput,
): Promise<UniconfigApplySnapshotOutput> {
  const json = await sendPostRequest([baseURL, '/operations/snapshot-manager:replace-config-with-snapshot'], params);
  const data = decodeUniconfigApplySnapshotOutput(json);

  return data;
}

export async function getCalculatedDiff(baseURL: string, params: UniconfigDiffInput): Promise<UniconfigDiffOutput> {
  const json = await sendPostRequest([baseURL, '/operations/uniconfig-manager:calculate-diff'], params);
  const data = decodeUniconfigDiffOuptut(json);

  return data;
}

export type UniConfigAPI = {
  getInstalledDevices: (baseURL: string) => Promise<InstalledDevicesOutput>;
  installDevice: (baseURL: string, params: unknown) => Promise<void>;
  uninstallDevice: (baseURL: string, params: UninstallDeviceInput) => Promise<void>;
  getUniconfigDatastore: (baseURL: string, options: DataStoreOptions) => Promise<UniconfigConfigOutput>;
  updateUniconfigDataStore: (baseURL: string, nodeId: string, params: UniconfigConfigInput) => Promise<void>;
  postCommitToNetwork: (baseURL: string, params: UniconfigCommitInput) => Promise<UniconfigCommitOutput>;
  postDryRunCommitToNetwork: (baseURL: string, params: UniconfigCommitInput) => Promise<UniconfigCommitOutput>;
  replaceConfig: (baseURL: string, params: UniconfigReplaceInput) => Promise<UniconfigReplaceOutput>;
  getSnapshots: (baseURL: string) => Promise<UniconfigSnapshotsOutput>;
  createSnapshot: (baseURL: string, params: UniconfigSnapshotInput) => Promise<UniconfigSnapshotOutput>;
  applySnapshot: (baseURL: string, params: UniconfigApplySnapshotInput) => Promise<UniconfigApplySnapshotOutput>;
  getCalculatedDiff: (baseURL: string, params: UniconfigDiffInput) => Promise<UniconfigDiffOutput>;
};

const uniconfigAPI: UniConfigAPI = {
  getInstalledDevices,
  installDevice,
  uninstallDevice,
  getUniconfigDatastore,
  updateUniconfigDataStore,
  postCommitToNetwork,
  postDryRunCommitToNetwork,
  replaceConfig,
  getSnapshots,
  createSnapshot,
  applySnapshot,
  getCalculatedDiff,
};

export default uniconfigAPI;
