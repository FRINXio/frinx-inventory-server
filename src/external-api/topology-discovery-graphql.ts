import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  CoordinatesInput,
  GetBackupsQuery,
  GetCommonNodesQuery,
  GetCommonNodesQueryVariables,
  GetHasAndInterfacesQuery,
  GetLinksAndDevicesQuery,
  GetShortestPathQuery,
  GetShortestPathQueryVariables,
  NetTopologyQuery,
  PtpDiffSynceQuery,
  PtpPathToGrandMasterQuery,
  PtpPathToGrandMasterQueryVariables,
  PtpTopologyQuery,
  TopologyDevicesQuery,
  TopologyDiffQuery,
  TopologyDiffQueryVariables,
  TopologyType,
  UpdateCoordinatesMutation,
  UpdateCoordinatesMutationVariables,
} from '../__generated__/topology-discovery.graphql';
import {
  HasAndInterfacesOutput,
  LinksAndDevicesOutput,
  TopologyDiffOutput,
  decodeHasAndInterfacesOutput,
  decodeLinksAndDevicesOutput,
  decodeTopologyDiffOutput,
} from './topology-network-types';

type CoordinatesParam = {
  device: string;
  x: number;
  y: number;
};

const GET_SHORTEST_PATH = gql`
  query GetShortestPath($deviceFrom: ID!, $deviceTo: ID!, $collection: NetRoutingPathOutputCollections) {
    netRoutingPaths(deviceFrom: $deviceFrom, deviceTo: $deviceTo, outputCollection: $collection) {
      edges {
        weight
        nodes {
          node
          weight
        }
      }
    }
  }
`;

const GET_TOPOLOGY_DEVICES = gql`
  query topologyDevices {
    phyDevices {
      edges {
        node {
          id
          name
          coordinates {
            x
            y
          }
          details {
            sw_version
            device_type
          }
          phyInterfaces {
            edges {
              node {
                id
                name
                status
                phyLink {
                  id
                  idLink
                  name
                  phyDevice {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_NET_TOPOLOGY_DEVICES = gql`
  query NetTopology {
    netDevices {
      edges {
        node {
          id
          routerId
          phyDevice {
            id
            routerId
            coordinates {
              x
              y
            }
          }
          netInterfaces {
            edges {
              cursor
              node {
                id
                ipAddress
                netDevice {
                  id
                  routerId
                }
                netLink {
                  id
                  igp_metric
                  netDevice {
                    id
                    routerId
                  }
                }
              }
            }
          }
          netNetworks {
            edges {
              node {
                id
                subnet
                coordinates {
                  x
                  y
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_BACKUPS = gql`
  query GetBackups {
    backups
  }
`;

const GET_TOPOLOGY_DIFF = gql`
  query topologyDiff($new_db: String!, $old_db: String!) {
    topologyDiff(new_db: $new_db, old_db: $old_db, collection_type: phy) {
      diff_data
    }
  }
`;

const GET_PTP_DIFF_SYNCE = gql`
  query ptpDiffSynce {
    ptpDiffSynce {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const GET_LINKS_AND_DEVICES = gql`
  query getLinksAndDevices {
    phyLinksAndDevices {
      phy_links_and_devices_data
    }
  }
`;

const GET_HAS_AND_INTERFACES = gql`
  query getHasAndInterfaces {
    phyHasAndInterfaces {
      phy_has_and_interfaces_data
    }
  }
`;

const GET_COMMON_NODES = gql`
  query getCommonNodes($selectedNodes: [String!]!) {
    commonNodes(selected_nodes: $selectedNodes) {
      common_nodes
    }
  }
`;

const UPDATE_COORDINATES = gql`
  mutation UpdateCoordinates($coordinates: [CoordinatesInput!]!, $topology_type: TopologyType) {
    updateCoordinates(coordinates_list: $coordinates, topology_type: $topology_type) {
      updated
    }
  }
`;

const PTP_TOPOLOGY = gql`
  fragment PtpDeviceParts on PtpDevice {
    id
    name
    coordinates {
      x
      y
    }
    details {
      clock_type
      domain
      ptp_profile
      clock_id
      parent_clock_id
      gm_clock_id
    }
    status
    labels
    ptpInterfaces {
      edges {
        cursor
        node {
          ...PtpInterfaceParts
        }
      }
    }
  }

  fragment PtpInterfaceDeviceParts on PtpDevice {
    id
    name
    coordinates {
      x
      y
    }
    ptpInterfaces {
      edges {
        node {
          id
          idLink
          name
          ptpLink {
            id
            idLink
            name
          }
        }
      }
    }
  }

  fragment PtpInterfaceParts on PtpInterface {
    id
    idLink
    name
    status
    ptpDevice {
      ...PtpInterfaceDeviceParts
    }
    ptpLink {
      id
      idLink
      ptpDevice {
        ...PtpInterfaceDeviceParts
      }
    }
  }

  query PtpTopology {
    ptpDevices {
      edges {
        cursor
        node {
          ...PtpDeviceParts
        }
      }
    }
  }
`;

const PTP_PATH = gql`
  query PtpPathToGrandMaster($deviceFrom: ID!) {
    ptpPathToGmClock(deviceFrom: $deviceFrom) {
      nodes
    }
  }
`;

function getTopologyDiscoveryApi() {
  if (!config.topologyEnabled) {
    return undefined;
  }

  const client = new GraphQLClient(config.topologyDiscoveryGraphqlURL);

  async function getShortestPath(from: string, to: string): Promise<GetShortestPathQuery> {
    const response = await client.request<GetShortestPathQuery, GetShortestPathQueryVariables>(GET_SHORTEST_PATH, {
      deviceFrom: from,
      deviceTo: to,
      collection: 'NetInterface',
    });

    return response;
  }

  async function getTopologyDevices(): Promise<TopologyDevicesQuery> {
    const response = await client.request<TopologyDevicesQuery>(GET_TOPOLOGY_DEVICES);

    return response;
  }

  async function getPtpDiffSynce(): Promise<PtpDiffSynceQuery> {
    const response = await client.request<PtpDiffSynceQuery>(GET_PTP_DIFF_SYNCE);

    return response;
  }

  async function getNetTopologyDevices(): Promise<NetTopologyQuery> {
    const response = await client.request<NetTopologyQuery>(GET_NET_TOPOLOGY_DEVICES);
    return response;
  }

  async function getBackups(): Promise<GetBackupsQuery> {
    const response = await client.request<GetBackupsQuery>(GET_BACKUPS);
    return response;
  }

  async function getTopologyDiff(version: string): Promise<TopologyDiffOutput> {
    const response = await client.request<TopologyDiffQuery, TopologyDiffQueryVariables>(GET_TOPOLOGY_DIFF, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      new_db: 'current',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      old_db: version,
    });
    const json = decodeTopologyDiffOutput(response.topologyDiff.diff_data);

    return json;
  }

  async function getHasAndInterfaces(): Promise<HasAndInterfacesOutput> {
    const response = await client.request<GetHasAndInterfacesQuery>(GET_HAS_AND_INTERFACES);
    const { phyHasAndInterfaces } = response;
    const json = decodeHasAndInterfacesOutput(phyHasAndInterfaces.phy_has_and_interfaces_data);

    return json;
  }

  async function getLinksAndDevices(): Promise<LinksAndDevicesOutput> {
    const response = await client.request<GetLinksAndDevicesQuery>(GET_LINKS_AND_DEVICES);
    const { phyLinksAndDevices } = response;
    const json = decodeLinksAndDevicesOutput(phyLinksAndDevices.phy_links_and_devices_data);

    return json;
  }

  async function getCommonNodes(selectedNodes: string[]): Promise<string[]> {
    const response = await client.request<GetCommonNodesQuery, GetCommonNodesQueryVariables>(GET_COMMON_NODES, {
      selectedNodes,
    });

    return response.commonNodes.common_nodes;
  }

  async function updateCoordinates(coordinates: CoordinatesParam[], topologyType?: TopologyType): Promise<string[]> {
    const coordinatesInput: CoordinatesInput[] = coordinates.map((c) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      node_name: c.device,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      node_type: 'device',
      x: c.x,
      y: c.y,
    }));
    const response = await client.request<UpdateCoordinatesMutation, UpdateCoordinatesMutationVariables>(
      UPDATE_COORDINATES,
      {
        coordinates: coordinatesInput,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        topology_type: topologyType,
      },
    );

    return response.updateCoordinates.updated;
  }

  async function getPtpTopology(): Promise<PtpTopologyQuery> {
    const response = await client.request<PtpTopologyQuery>(PTP_TOPOLOGY);

    return response;
  }

  async function getPtpPathToGrandMaster(deviceFrom: string): Promise<string[] | null> {
    const response = await client.request<PtpPathToGrandMasterQuery, PtpPathToGrandMasterQueryVariables>(PTP_PATH, {
      deviceFrom,
    });

    return response.ptpPathToGmClock.nodes;
  }

  return {
    getTopologyDevices,
    getPtpDiffSynce,
    getNetTopologyDevices,
    getShortestPath,
    getBackups,
    getTopologyDiff,
    getHasAndInterfaces,
    getLinksAndDevices,
    getCommonNodes,
    getPtpTopology,
    getPtpPathToGrandMaster,
    updateCoordinates,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
