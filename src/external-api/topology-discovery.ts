import { sendGetRequest, sendPatchRequest, sendPostRequest } from './helpers';
import {
  decodeHasAndInterfacesOutput,
  decodeLinksAndDevicesOutput,
  decodeNetAdvertisesAndNetworks,
  decodeNetHasAndInterfacesOutput,
  decodeNetLinksAndDevicesOutput,
  decodeTopologyCommonNodesOutput,
  decodeTopologyDiffOutput,
  decodeUpdateCoordinatesOutput,
  decodeVersionsOutput,
  HasAndInterfacesOutput,
  LinksAndDevicesOutput,
  NetAdvertisesAndNetworksOutput,
  NetHasAndInterfacesOutput,
  NetLinksAndDevicesOutput,
  TopologyCommonNodesOutput,
  TopologyDiffOutput,
  UpdateCoordinatesOutput,
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

async function getHasAndInterfaces(baseURL: string): Promise<HasAndInterfacesOutput> {
  const json = await sendGetRequest([baseURL, '/has-and-interfaces']);
  const data = decodeHasAndInterfacesOutput(json);
  return data;
}

type NodeCoordinatesBody = {
  device: string;
  x: number;
  y: number;
};

async function updateCoordinates(
  baseURL: string,
  nodeCoordinates: NodeCoordinatesBody[],
): Promise<UpdateCoordinatesOutput> {
  const json = await sendPatchRequest([baseURL, '/coordinates'], nodeCoordinates);
  const data = decodeUpdateCoordinatesOutput(json);
  return data;
}

async function getNetHasAndInterfaces(baseURL: string): Promise<NetHasAndInterfacesOutput> {
  const json = await sendGetRequest([baseURL, '/net-has-and-interfaces']);
  const data = decodeNetHasAndInterfacesOutput(json);
  return data;
}

async function getNetLinksAndDevices(baseURL: string): Promise<NetLinksAndDevicesOutput> {
  const json = await sendGetRequest([baseURL, '/net-links-and-devices']);
  const data = decodeNetLinksAndDevicesOutput(json);
  return data;
}

async function getNetAdvertisesAndNetworks(baseURL: string): Promise<NetAdvertisesAndNetworksOutput> {
  const json = await sendGetRequest([baseURL, '/net-advertises-and-networks']);
  const data = decodeNetAdvertisesAndNetworks(json);
  return data;
}

const topologyDiscoveryAPI = {
  getVersions,
  getTopologyDiff,
  getCommonNodes,
  getLinksAndDevices,
  getHasAndInterfaces,
  updateCoordinates,
  getNetHasAndInterfaces,
  getNetLinksAndDevices,
  getNetAdvertisesAndNetworks,
};

export type TopologyDiscoveryAPI = typeof topologyDiscoveryAPI;

export default topologyDiscoveryAPI;
