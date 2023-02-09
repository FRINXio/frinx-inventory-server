import { sendGetRequest, sendPostRequest } from './helpers';
import {
  decodeHasOutput,
  decodeLinksAndDevicesOutput,
  decodeTopologyCommonNodesOutput,
  decodeTopologyDiffOutput,
  decodeVersionsOutput,
  HasOutput,
  LinksAndDevicesOutput,
  TopologyCommonNodesOutput,
  TopologyDiffOutput,
  VersionsOutput,
} from './topology-network-types';

async function getVersions(baseURL: string): Promise<VersionsOutput> {
  const json = await sendGetRequest([baseURL, '/backup']);
  const data = decodeVersionsOutput(json);
  return data;
}

async function getTopologyDiff(baseURL: string, version: string): Promise<TopologyDiffOutput> {
  const body = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new_db: 'current',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    old_db: version,
  };
  const json = await sendPostRequest([baseURL, '/diff'], body);
  const data = decodeTopologyDiffOutput(json);
  return data;
}

async function getCommonNodes(baseURL: string, nodes: string[]): Promise<TopologyCommonNodesOutput> {
  const body = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'selected-nodes': nodes,
  };
  const json = await sendPostRequest([baseURL, '/common-nodes'], body);
  const data = decodeTopologyCommonNodesOutput(json);
  return data;
}

async function getLinksAndDevices(baseURL: string): Promise<LinksAndDevicesOutput> {
  const json = await sendGetRequest([baseURL, '/links-and-devices']);
  const data = decodeLinksAndDevicesOutput(json);
  return data;
}

async function getHas(baseURL: string): Promise<HasOutput> {
  const json = await sendGetRequest([baseURL, '/has']);
  const data = decodeHasOutput(json);
  return data;
}

const topologyDiscoveryAPI = {
  getVersions,
  getTopologyDiff,
  getCommonNodes,
  getLinksAndDevices,
  getHas,
};

export type TopologyDiscoveryAPI = typeof topologyDiscoveryAPI;

export default topologyDiscoveryAPI;
