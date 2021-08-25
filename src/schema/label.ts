import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, intArg, list, nonNull, objectType, stringArg } from 'nexus';
import { convertDBLabel } from '../helpers/converters';
import { Node } from './global-types';

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
  },
});
export const LabelConnection = objectType({
  name: 'LabelConnection',
  definition: (t) => {
    t.nonNull.field('edges', { type: nonNull(list(nonNull(LabelEdge))) });
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
