import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus';
import { toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Blueprint = objectType({
  name: 'Blueprint',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Blueprint', root.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('createdAt', {
      resolve: (root) => root.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (root) => root.updatedAt.toISOString(),
    });
    t.nonNull.string('template');
  },
});

export const BlueprintEdge = objectType({
  name: 'BlueprintEdge',
  definition: (t) => {
    t.nonNull.field('node', { type: Blueprint });
    t.nonNull.string('cursor');
  },
});
export const BlueprintConnection = objectType({
  name: 'BlueprintConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: BlueprintEdge });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});
export const BlueprintsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('blueprints', {
      type: BlueprintConnection,
      args: PaginationConnectionArgs,
      resolve: async (_, args, { prisma, tenantId }) => {
        const baseArgs = { where: { tenantId } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.blueprint.findMany({ ...baseArgs, ...paginationArgs }),
          () => prisma.blueprint.count(baseArgs),
          args,
        );
        return result;
      },
    });
  },
});

export const AddBlueprintPayload = objectType({
  name: 'AddBlueprintPayload',
  definition: (t) => {
    t.nonNull.field('blueprint', { type: Blueprint });
  },
});
export const AddBlueprintInput = inputObjectType({
  name: 'AddBlueprintInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('template');
  },
});
export const AddBlueprintMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addBlueprint', {
      type: AddBlueprintPayload,
      args: {
        input: nonNull(arg({ type: AddBlueprintInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { input } = args;
        const blueprint = await prisma.blueprint.create({
          data: {
            tenantId,
            name: input.name,
            template: input.template,
          },
        });
        return { blueprint };
      },
    });
  },
});
