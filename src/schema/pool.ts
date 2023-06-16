import { enumType, extendType, inputObjectType, objectType, stringArg } from 'nexus';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { apiPoolsToGraphqlPools } from '../helpers/resource-manager.helpers';

export const PoolType = enumType({
  name: 'PoolType',
  members: ['allocating', 'set', 'singleton'],
});

export const Tag = objectType({
  name: 'Tag',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('tag');
  },
});

export const ResourceType = objectType({
  name: 'ResourceType',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('name');
  },
});

export const Pool = objectType({
  name: 'Pool',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id');
    t.nonNull.string('name');
    t.nonNull.field('poolType', { type: PoolType });
    t.nonNull.list.field('tags', { type: Tag });
    t.nonNull.field('resourceType', { type: ResourceType });
  },
});

export const PoolEdge = objectType({
  name: 'PoolEdge',
  definition: (t) => {
    t.nonNull.field('node', { type: Pool });
    t.nonNull.string('cursor');
  },
});

export const PoolConnection = objectType({
  name: 'PoolConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: PoolEdge });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const FilterPoolsInput = inputObjectType({
  name: 'FilterPoolsInput',
  definition: (t) => {
    t.string('poolName');
  },
});

export const ResourceTypeInput = inputObjectType({
  name: 'ResourceTypeInput',
  definition: (t) => {
    t.string('resourceTypeId');
  },
});

export const PoolQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('pools', {
      type: PoolConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: FilterPoolsInput,
        resourceTypeId: stringArg(),
      },
      resolve: async (_, args, { resourceManagerAPI }) => {
        const { resourceTypeId, filter, ...paginationArgs } = args;
        const { QueryRootResourcePools: resourcePoolsData } = await resourceManagerAPI.getPools(
          resourceTypeId ?? null,
          paginationArgs,
          null,
        );
        const result = apiPoolsToGraphqlPools(resourcePoolsData);
        return result;
      },
    });
  },
});
