import { isString } from 'fp-ts/lib/string';
import { Response } from 'node-fetch';
import { sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';
import {
  CheckInstalledNodesInput,
  CheckInstalledNodesOutput,
  decodeInstalledDevicesOutput,
  decodeInstalledNodeOutput,
  decodeUniconfigApplySnapshotOutput,
  decodeUniconfigCommitOutput,
  decodeUniconfigConfigOutput,
  decodeUniconfigDeleteSnapshotOutput,
  decodeUniconfigDiffOuptut,
  decodeUniconfigDryRunCommitOutput,
  decodeUniconfigExternalStorageOutput,
  decodeUniconfigInstallMultipleNodesOutput,
  decodeUniconfigInstallOutput,
  decodeUniconfigReplaceOutput,
  decodeUniconfigRevertChangesOutput,
  decodeUniconfigSnapshotOutput,
  decodeUniconfigSnapshotsOutput,
  decodeUniconfigSyncOutput,
  decodeUniconfigTransactionLogOutput,
  InstalledDevicesOutput,
  RevertChangesInput,
  UniconfigApplySnapshotInput,
  UniconfigApplySnapshotOutput,
  UniconfigCommitInput,
  UniconfigCommitOutput,
  UniconfigConfigInput,
  UniconfigConfigOutput,
  UniconfigDeleteSnapshotOutput,
  UniconfigDeleteSnapshotParams,
  UniconfigDiffInput,
  UniconfigDiffOutput,
  UniconfigDryRunCommitOutput,
  UniconfigInstallMultipleNodesOutput,
  UniconfigInstallOutput,
  UniconfigReplaceInput,
  UniconfigReplaceOutput,
  UniconfigRevertChangesOutput,
  UniconfigSnapshotInput,
  UniconfigSnapshotOutput,
  UniconfigSnapshotsOutput,
  UniconfigSyncInput,
  UniconfigSyncOutput,
  UniconfigTransactionLogOutput,
  UninstallDeviceInput,
} from './network-types';

export async function getInstalledDevices(baseURL: string): Promise<InstalledDevicesOutput> {
  const json = await sendPostRequest([baseURL, '/operations/connection-manager:get-installed-nodes']);
  const data = decodeInstalledDevicesOutput(json);

  return data;
}

export async function installDevice(baseURL: string, params: unknown): Promise<UniconfigInstallOutput> {
  const json = await sendPostRequest([baseURL, '/operations/connection-manager:install-node'], params);
  const data = decodeUniconfigInstallOutput(json);

  return data;
}

export async function uninstallDevice(baseURL: string, params: UninstallDeviceInput): Promise<void> {
  await sendPostRequest([baseURL, '/operations/connection-manager:uninstall-node'], params);
}

export async function getCheckInstalledDevices(
  baseURL: string,
  input: CheckInstalledNodesInput,
): Promise<CheckInstalledNodesOutput> {
  const json = await sendPostRequest([baseURL, '/operations/connection-manager:check-installed-nodes'], input);
  const data = decodeInstalledNodeOutput(json);

  return data;
}

export async function installMultipleDevices(
  baseURL: string,
  input: unknown,
): Promise<UniconfigInstallMultipleNodesOutput> {
  const json = await sendPostRequest([baseURL, '/operations/connection-manager:install-multiple-nodes'], input);
  const data = decodeUniconfigInstallMultipleNodesOutput(json);

  return data;
}

/*
TRANSACTION AWARE API CALLS:
*/

export type DataStoreOptions = {
  nodeId: string;
  datastoreType: 'operational' | 'config';
};

const DATA_STORE_MAP = {
  operational: 'nonconfig',
  config: 'config',
};

function makeCookieFromTransactionId(transactionId: string): string {
  const date = new Date();
  // 1 day expiration
  date.setTime(date.getTime() + 1 * 24 * 60 * 60 * 1000);

  return `UNICONFIGTXID=${transactionId};expires=${date.toUTCString()}`;
}

export async function getUniconfigDatastore(
  baseURL: string,
  options: DataStoreOptions,
  transactionId: string,
): Promise<UniconfigConfigOutput> {
  const { nodeId, datastoreType } = options;
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendGetRequest(
    [
      baseURL,
      `/data/network-topology:network-topology/network-topology:topology=uniconfig/network-topology:node=${nodeId}/frinx-uniconfig-topology:configuration?content=${DATA_STORE_MAP[datastoreType]}`,
    ],
    cookie,
  );
  const data = decodeUniconfigConfigOutput(json);

  return data;
}

export async function updateUniconfigDataStore(
  baseURL: string,
  nodeId: string,
  params: UniconfigConfigInput,
  transactionId: string,
): Promise<void> {
  const cookie = makeCookieFromTransactionId(transactionId);
  await sendPutRequest(
    [
      baseURL,
      `/data/network-topology:network-topology/network-topology:topology=uniconfig/network-topology:node=${nodeId}/frinx-uniconfig-topology:configuration`,
    ],
    params,
    cookie,
  );
}

export async function postCommitToNetwork(
  baseURL: string,
  params: UniconfigCommitInput,
  transactionId: string,
): Promise<UniconfigCommitOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, '/operations/uniconfig-manager:commit'], params, cookie);
  const data = decodeUniconfigCommitOutput(json);

  return data;
}

export async function postDryRunCommitToNetwork(
  baseURL: string,
  params: UniconfigCommitInput,
  transactionId: string,
): Promise<UniconfigDryRunCommitOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, '/operations/dryrun-manager:dryrun-commit'], params, cookie);
  const data = decodeUniconfigDryRunCommitOutput(json);

  return data;
}

export async function replaceConfig(
  baseURL: string,
  params: UniconfigReplaceInput,
  transactionId: string,
): Promise<UniconfigReplaceOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest(
    [baseURL, '/operations/uniconfig-manager:replace-config-with-operational'],
    params,
    cookie,
  );
  const data = decodeUniconfigReplaceOutput(json);

  return data;
}

export async function getSnapshots(baseURL: string, transactionId: string): Promise<UniconfigSnapshotsOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendGetRequest([baseURL, '/data/snapshot-manager:snapshots-metadata?content=config'], cookie);
  const data = decodeUniconfigSnapshotsOutput(json);

  return data;
}

export async function createSnapshot(
  baseURL: string,
  params: UniconfigSnapshotInput,
  transactionId: string,
): Promise<UniconfigSnapshotOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, '/operations/snapshot-manager:create-snapshot'], params, cookie);
  const data = decodeUniconfigSnapshotOutput(json);

  return data;
}

export async function applySnapshot(
  baseURL: string,
  params: UniconfigApplySnapshotInput,
  transactionId: string,
): Promise<UniconfigApplySnapshotOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest(
    [baseURL, '/operations/snapshot-manager:replace-config-with-snapshot'],
    params,
    cookie,
  );
  const data = decodeUniconfigApplySnapshotOutput(json);

  return data;
}

export async function getCalculatedDiff(
  baseURL: string,
  params: UniconfigDiffInput,
  transactionId: string,
): Promise<UniconfigDiffOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, '/operations/uniconfig-manager:calculate-diff'], params, cookie);
  const data = decodeUniconfigDiffOuptut(json);

  return data;
}

export async function syncFromNetwork(
  baseURL: string,
  params: UniconfigSyncInput,
  transactionId: string,
): Promise<UniconfigSyncOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, '/operations/uniconfig-manager:sync-from-network'], params, cookie);
  const data = decodeUniconfigSyncOutput(json);

  return data;
}

export async function deleteSnapshot(
  baseURL: string,
  params: UniconfigDeleteSnapshotParams,
  transactionId: string,
): Promise<UniconfigDeleteSnapshotOutput> {
  const cookie = makeCookieFromTransactionId(transactionId);
  const json = await sendPostRequest([baseURL, 'operations/snapshot-manager:delete-snapshot'], params, cookie);
  const data = decodeUniconfigDeleteSnapshotOutput(json);

  return data;
}

async function createTransaction(baseURL: string): Promise<string> {
  const response = await sendPostRequest([baseURL, '/operations/uniconfig-manager:create-transaction']);
  const data = await (response as Response).text();
  if (!isString(data)) {
    throw new Error('not a string');
  }
  return data;
}

export type CloseTransactionParams = {
  authToken: string;
  transactionId: string;
};

async function closeTransaction(baseURL: string, transactionId: string): Promise<void> {
  const cookie = makeCookieFromTransactionId(transactionId);
  await sendPostRequest([baseURL, '/operations/uniconfig-manager:close-transaction'], undefined, cookie);
}

async function getTransactionLog(baseURL: string): Promise<UniconfigTransactionLogOutput> {
  const json = await sendGetRequest([baseURL, '/data/transaction-log:transactions-metadata?content=nonconfig']);
  const data = decodeUniconfigTransactionLogOutput(json);

  return data;
}

async function revertChanges(baseURL: string, params: RevertChangesInput): Promise<UniconfigRevertChangesOutput> {
  const json = await sendPostRequest([baseURL, '/operations/transaction-log:revert-changes'], params);
  const data = decodeUniconfigRevertChangesOutput(json);

  return data;
}

async function getExternalStorage(baseURL: string, path: string): Promise<Record<string, string>> {
  const json = await sendGetRequest([baseURL, `/external/postgres/${path}`]);
  const data = decodeUniconfigExternalStorageOutput(json);

  return data;
}

const uniconfigAPI = {
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
  syncFromNetwork,
  deleteSnapshot,
  createTransaction,
  closeTransaction,
  getTransactionLog,
  revertChanges,
  getExternalStorage,
};

export type UniConfigAPI = typeof uniconfigAPI;

export default uniconfigAPI;
