import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { arg, extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Label = objectType({
  name: 'Label',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Label', root.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('createdAt', {
      resolve: (root) => root.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (root) => root.updatedAt.toISOString(),
    });
  },
});

export const LabelEdge = objectType({
  name: 'LabelEdge',
  definition: (t) => {
    t.nonNull.field('node', { type: Label });
    t.nonNull.string('cursor');
  },
});
export const LabelConnection = objectType({
  name: 'LabelConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: LabelEdge });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const FilterLabelsInput = inputObjectType({
  name: 'FilterLabelsInput',
  definition: (t) => {
    t.string('name');
  },
});

export const LabelsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('labels', {
      type: LabelConnection,
      args: { ...PaginationConnectionArgs, filter: FilterLabelsInput },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { filter, ...paginationArgs } = args;
        const baseArgs = { where: { tenantId, ...(filter?.name ? filter : {}) } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.label.findMany({ ...baseArgs, ...paginationArgs }),
          () => prisma.label.count(baseArgs),
          args,
        );
        return result;
      },
    });
  },
});

export const CreateLabelPayload = objectType({
  name: 'CreateLabelPayload',
  definition: (t) => {
    t.field('label', { type: Label });
  },
});
const CreateLabelInput = inputObjectType({
  name: 'CreateLabelInput',
  definition: (t) => {
    t.nonNull.string('name');
  },
});
export const CreateLabelMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('createLabel', {
      type: CreateLabelPayload,
      args: {
        input: nonNull(arg({ type: CreateLabelInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { name } = args.input;
        const dbLabel = await prisma.label.create({
          data: {
            name,
            tenantId,
          },
        });
        return {
          label: dbLabel,
        };
      },
    });
  },
});

export const DeleteLabelPayload = objectType({
  name: 'DeleteLabelPayload',
  definition: (t) => {
    t.field('label', { type: Label });
  },
});
export const DeleteLabelMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deleteLabel', {
      type: DeleteLabelPayload,
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const nativeLabelId = fromGraphId('Label', args.id);
        const dbLabel = await prisma.label.findFirst({ where: { id: nativeLabelId, tenantId } });
        if (dbLabel == null) {
          throw new Error('label not found');
        }
        const deletedLabel = await prisma.label.delete({ where: { id: nativeLabelId } });
        return {
          label: deletedLabel,
        };
      },
    });
  },
});
