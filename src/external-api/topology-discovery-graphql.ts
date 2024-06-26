import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  CoordinatesInput,
  GetBackupsQuery,
  GetCommonNodesQuery,
  GetCommonNodesQueryVariables,
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
  SynceTopologyQuery,
  SyncePathToGrandMasterQuery,
  SyncePathToGrandMasterQueryVariables,
} from '../__generated__/topology-discovery.graphql';
import { TopologyDiffOutput, decodeTopologyDiffOutput } from './topology-network-types';

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
          status
          labels
          routerId
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
                phyLinks {
                  edges {
                    link
                    node {
                      id
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
    }
  }
`;

const GET_NET_TOPOLOGY_DEVICES = gql`
  query NetTopology {
    netDevices {
      edges {
        cursor
        node {
          id
          routerId
          ospfAreaId
          phyDevice {
            id
            name
            status
            details {
              device_type
              sw_version
            }
            labels
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
                netLinks {
                  edges {
                    link
                    node {
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
            }
          }
          netNetworks {
            edges {
              cursor
              node {
                id
                subnet
                ospfRouteType
                coordinates {
                  x
                  y
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
  query topologyDiff($new_db: String!, $old_db: String!, $collection_type: TopologyType!) {
    topologyDiff(new_db: $new_db, old_db: $old_db, collection_type: $collection_type) {
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
      not_installed
      installed {
        not_updated
        updated
      }
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
      clock_class
      clock_accuracy
      clock_variance
      time_recovery_status
      global_priority
      user_priority
    }
    status
    labels
    ptpInterfaces {
      edges {
        cursor
        node {
          ...PtpInterfaceParts
          details {
            ptp_status
            ptsf_unusable
            admin_oper_status
          }
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
          name
          ptpLinks {
            edges {
              link
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }

  fragment PtpInterfaceParts on PtpInterface {
    id
    name
    status
    ptpLinks {
      edges {
        link
        node {
          id
          ptpDevice {
            ...PtpInterfaceDeviceParts
          }
        }
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

const SYNCE_TOPOLOGY = gql`
  fragment SynceDeviceParts on SynceDevice {
    id
    name
    coordinates {
      x
      y
    }
    details {
      selected_for_use
    }
    status
    labels
    synceInterfaces {
      edges {
        cursor
        node {
          ...SynceInterfaceParts
          details {
            synce_enabled
            rx_quality_level
            qualified_for_use
            not_qualified_due_to
            not_selected_due_to
          }
        }
      }
    }
  }

  fragment SynceInterfaceDeviceParts on SynceDevice {
    id
    name
    coordinates {
      x
      y
    }
    synceInterfaces {
      edges {
        node {
          id
          name
          synceLinks {
            edges {
              link
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }

  fragment SynceInterfaceParts on SynceInterface {
    id
    name
    status
    synceDevice {
      ...SynceInterfaceDeviceParts
    }
    synceLinks {
      edges {
        link
        node {
          id
          synceDevice {
            ...SynceInterfaceDeviceParts
          }
        }
      }
    }
  }

  query SynceTopology {
    synceDevices {
      edges {
        cursor
        node {
          ...SynceDeviceParts
        }
      }
    }
  }
`;

const SYNCE_PATH = gql`
  query SyncePathToGrandMaster($deviceFrom: ID!) {
    syncePathToGm(deviceFrom: $deviceFrom) {
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

  async function getTopologyDiff(version: string, collectionType: TopologyType): Promise<TopologyDiffOutput> {
    const response = await client.request<TopologyDiffQuery, TopologyDiffQueryVariables>(GET_TOPOLOGY_DIFF, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      new_db: 'current',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      old_db: version,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      collection_type: collectionType,
    });
    const json = decodeTopologyDiffOutput(response.topologyDiff.diff_data);

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

    return response.updateCoordinates.installed.updated;
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

  async function getSynceTopology(): Promise<SynceTopologyQuery> {
    const response = await client.request<SynceTopologyQuery>(SYNCE_TOPOLOGY);

    return response;
  }

  async function getSyncePathToGrandMaster(deviceFrom: string): Promise<string[] | null> {
    const response = await client.request<SyncePathToGrandMasterQuery, SyncePathToGrandMasterQueryVariables>(
      SYNCE_PATH,
      {
        deviceFrom,
      },
    );

    return response.syncePathToGm.nodes;
  }

  return {
    getTopologyDevices,
    getPtpDiffSynce,
    getNetTopologyDevices,
    getShortestPath,
    getBackups,
    getTopologyDiff,
    getCommonNodes,
    getPtpTopology,
    getPtpPathToGrandMaster,
    updateCoordinates,
    getSynceTopology,
    getSyncePathToGrandMaster,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
