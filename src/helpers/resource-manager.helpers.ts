import { compact } from 'lodash';
import { GetPoolsQuery, PoolFragmentFragment } from '../__generated__/resource-manager.graphql';
import { NexusGenObjects } from '../schema/nexus-typegen';
import { toGraphId } from './id-helper';
import { unwrap } from './utils.helpers';

export function apiPoolEdgeToGraphqlPoolEdge(apiPool: PoolFragmentFragment) {
  return {
    id: toGraphId('Pool', apiPool.id),
    name: apiPool.Name,
    poolType: apiPool.PoolType,
    tags: apiPool.Tags.map((t) => ({
      id: t.id,
      tag: t.Tag,
    })),
    resourceType: {
      id: apiPool.id,
      name: apiPool.Name,
    },
    poolProperties: apiPool.PoolProperties,
  };
}

export function apiPoolsToGraphqlPools(
  queryPools: GetPoolsQuery['QueryRootResourcePools'],
): NexusGenObjects['PoolConnection'] {
  const { edges, pageInfo } = queryPools;

  const newEdges = compact(edges).map((e) => {
    const { node, cursor } = unwrap(e);
    return {
      node: apiPoolEdgeToGraphqlPoolEdge(node),
      cursor: cursor.toString(),
    };
  });
  return {
    edges: newEdges,
    pageInfo: {
      hasNextPage: pageInfo.hasNextPage,
      hasPreviousPage: pageInfo.hasPreviousPage,
      startCursor: pageInfo.startCursor?.ID,
      endCursor: pageInfo.endCursor?.ID,
    },
    totalCount: newEdges.length,
  };
}
