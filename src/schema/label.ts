import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, intArg, nonNull, objectType, stringArg } from 'nexus';
import { convertDBLabel } from '../helpers/converters';
import { fromGraphId } from '../helpers/id-helper';
import { Node, PageInfo } from './global-types';

export const Label = objectType({
  name: 'Label',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.string('name');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
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
  },
});

export const LabelsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('labels', {
      type: LabelConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const dbLabels = await prisma.label.findMany({ where: { tenantId } });
        const labels = dbLabels.map(convertDBLabel);
        return connectionFromArray(labels, args);
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
          label: convertDBLabel(dbLabel),
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
          label: convertDBLabel(deletedLabel),
        };
      },
    });
  },
});
