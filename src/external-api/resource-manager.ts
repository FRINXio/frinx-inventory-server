import { PaginationArgs } from 'nexus/dist/plugins/connectionPlugin';
import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  GetPoolQuery,
  GetPoolQueryVariables,
  GetPoolsQuery,
  GetPoolsQueryVariables,
  PoolFragmentFragment,
} from '../__generated__/resource-manager.graphql';

const client = new GraphQLClient(config.resourceManagerApiURL);

const POOL_FRAGMENT = gql`
  fragment PoolFragment on ResourcePool {
    id
    Name
    PoolType
    Tags {
      id
      Tag
    }
    PoolProperties
    ResourceType {
      id
      Name
    }
  }
`;

const GET_POOL_QUERY = gql`
  query GetPool($nodeId: ID!) {
    node(id: $nodeId) {
      ... on ResourcePool {
        ...PoolFragment
      }
    }
  }
  ${POOL_FRAGMENT}
`;

const GET_POOLS_QUERY = gql`
  query GetPools(
    $resourceTypeId: ID
    $first: Int
    $last: Int
    $before: Cursor
    $after: Cursor
    $filterByResources: Map
  ) {
    QueryRootResourcePools(
      resourceTypeId: $resourceTypeId
      first: $first
      last: $last
      before: $before
      after: $after
      filterByResources: $filterByResources
    ) {
      edges {
        node {
          ...PoolFragment
        }
        cursor {
          ID
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor {
          ID
        }
        endCursor {
          ID
        }
      }
      totalCount
    }
  }
  ${POOL_FRAGMENT}
`;

async function getPool(nodeId: string): Promise<PoolFragmentFragment | null> {
  const response = await client.request<GetPoolQuery, GetPoolQueryVariables>(GET_POOL_QUERY, {
    nodeId,
  });

  if (response.node?.__typename !== 'ResourcePool') {
    return null;
  }

  return response.node;
}

async function getPools(
  resourceTypeId: string | null,
  paginationArgs: PaginationArgs,
  filter: Map<string, string> | null,
) {
  const response = await client.request<GetPoolsQuery, GetPoolsQueryVariables>(GET_POOLS_QUERY, {
    resourceTypeId,
    ...paginationArgs,
    filterByResources: filter,
  });

  return response;
}

const resourceManagerAPI = {
  getPool,
  getPools,
};

export type ResourceManagerAPI = typeof resourceManagerAPI;
export default resourceManagerAPI;
