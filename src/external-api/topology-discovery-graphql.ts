import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  CoordinatesInput,
  GetBackupsQuery,
  GetCommonNodesQuery,
  GetCommonNodesQueryVariables,
  GetHasAndInterfacesQuery,
  GetHasAndInterfacesQueryVariables,
  GetLinksAndDevicesQuery,
  GetShortestPathQuery,
  GetShortestPathQueryVariables,
  NetTopologyQuery,
  TopologyDevicesQuery,
  TopologyDiffQuery,
  TopologyDiffQueryVariables,
  UpdateCoordinatesMutation,
  UpdateCoordinatesMutationVariables,
} from '../__generated__/topology-discovery.graphql';
import {
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
  mutation UpdateCoordinates($coordinates: [CoordinatesInput!]!) {
    updateCoordinates(coordinates_list: $coordinates) {
      updated
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

  async function getTopologyDevices() {
    const response = await client.request<TopologyDevicesQuery>(GET_TOPOLOGY_DEVICES);

    return response;
  }

  async function getNetTopologyDevices() {
    const response = await client.request<NetTopologyQuery>(GET_NET_TOPOLOGY_DEVICES);

    return response;
  }

  async function getBackups() {
    const response = await client.request<GetBackupsQuery>(GET_BACKUPS);
    return response;
  }

  async function getTopologyDiff(version: string) {
    const response = await client.request<TopologyDiffQuery, TopologyDiffQueryVariables>(GET_TOPOLOGY_DIFF, {
      new_db: 'current',
      old_db: version,
    });
    console.log('topologyDiff response: ', response.topologyDiff.diff_data);
    const json = decodeTopologyDiffOutput(response.topologyDiff.diff_data);
    console.log(json.added);
    console.log(json.changed);
    console.log(json.deleted);
    console.log('topologyDiff: OK');

    return json;
  }

  async function getHasAndInterfaces() {
    const response = await client.request<GetHasAndInterfacesQuery>(GET_HAS_AND_INTERFACES);
    const { phyHasAndInterfaces } = response;
    console.log('hasAndInterfaces: ', phyHasAndInterfaces);
    const json = decodeHasAndInterfacesOutput(phyHasAndInterfaces.phy_has_and_interfaces_data);

    return json;
  }

  async function getLinksAndDevices() {
    const response = await client.request<GetLinksAndDevicesQuery>(GET_LINKS_AND_DEVICES);
    const { phyLinksAndDevices } = response;
    console.log('linksAndDevices: ', phyLinksAndDevices);
    const json = decodeLinksAndDevicesOutput(phyLinksAndDevices.phy_links_and_devices_data);
    console.log('linksAndDevices: OK');

    return json;
  }

  async function getCommonNodes(selectedNodes: string[]) {
    const response = await client.request<GetCommonNodesQuery, GetCommonNodesQueryVariables>(GET_COMMON_NODES, {
      selectedNodes,
    });

    return response.commonNodes.common_nodes;
  }

  async function updateCoordinates(coordinates: CoordinatesParam[]) {
    const coordinatesInput: CoordinatesInput[] = coordinates.map((c) => ({
      node_name: c.device,
      node_type: 'device',
      x: c.x,
      y: c.y,
    }));
    const response = await client.request<UpdateCoordinatesMutation, UpdateCoordinatesMutationVariables>(
      UPDATE_COORDINATES,
      {
        coordinates: coordinatesInput,
      },
    );

    return response.updateCoordinates.updated;
  }

  return {
    getTopologyDevices,
    getNetTopologyDevices,
    getShortestPath,
    getBackups,
    getTopologyDiff,
    getHasAndInterfaces,
    getLinksAndDevices,
    getCommonNodes,
    updateCoordinates,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
