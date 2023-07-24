import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import { GetShortestPathQuery, GetShortestPathQueryVariables } from '../__generated__/topology-discovery.graphql';

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

  return {
    getShortestPath,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
