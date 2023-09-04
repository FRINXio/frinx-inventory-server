import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  GetBackupsQuery,
  GetShortestPathQuery,
  GetShortestPathQueryVariables,
  NetTopologyQuery,
  TopologyDevicesQuery,
} from '../__generated__/topology-discovery.graphql';

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

  return {
    getTopologyDevices,
    getNetTopologyDevices,
    getShortestPath,
    getBackups,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
