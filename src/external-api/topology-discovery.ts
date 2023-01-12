import { sendGetRequest, sendPostRequest } from './helpers';
import {
  decodeTopologyCommonNodesOutput,
  decodeTopologyDiffOutput,
  decodeVersionsOutput,
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

const topologyDiscoveryAPI = {
  getVersions,
  getTopologyDiff,
  getCommonNodes,
};

export type TopologyDiscoveryAPI = typeof topologyDiscoveryAPI;

export default topologyDiscoveryAPI;
