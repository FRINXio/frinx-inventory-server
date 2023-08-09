import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  GetShortestPathQuery,
  GetShortestPathQueryVariables,
  TopologyDevicesQuery,
  TopologyDevicesQueryVariables,
} from '../__generated__/topology-discovery.graphql';

const GET_SHORTEST_PATH = gql`
  query GetShortestPath($deviceFrom: ID!, $deviceTo: ID!, $collection: NetRoutingPathOutputCollections) {
    netRoutingPaths(deviceFrom: $deviceFrom, deviceTo: $deviceTo, outputCollection: $collection) {
      shortestPath {
        edges
      }
      alternativePaths {
        edges
      }
    }
  }
`;

const GET_TOPOLOGY_DEVICES = gql`
  query topologyDevices($filter: PhyDeviceFilter) {
    phyDevices(first: 10000, filter: $filter) {
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
          phyInterfaces(first: 10000, filter: { name: "%" }) {
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

function getTopologyDiscoveryApi() {
  if (!config.topologyEnabled) {
    return undefined;
  }

  const client = new GraphQLClient(config.topologyDiscoveryGraphqlURL);

  async function getShortestPath(from: string, to: string): Promise<GetShortestPathQuery> {
    const response = await client.request<GetShortestPathQuery, GetShortestPathQueryVariables>(GET_SHORTEST_PATH, {
      deviceFrom: from,
      deviceTo: to,
    });

    return response;
  }

  async function getTopologyDevices() {
    const response = await client.request<TopologyDevicesQuery, TopologyDevicesQueryVariables>(GET_TOPOLOGY_DEVICES, {
      // topology discovery server changes requested:
      // first: argument should be changed to optional (to response with all nodes)
      // filter: is optional, but is failing without id
      filter: { name: '%' },
    });

    return response;
  }

  return {
    getTopologyDevices,
    getShortestPath,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
