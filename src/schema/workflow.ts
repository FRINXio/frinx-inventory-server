import { connectionFromArray } from 'graphql-relay';
import { extendType, inputObjectType, objectType } from 'nexus';
import config from '../config';
import { WorfklowMetadataOutput } from '../external-api/conductor-network-types';
import { toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Workflow = objectType({
  name: 'Worfklow',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (workflow) => toGraphId('Workflow', workflow.name),
    });
    t.nonNull.string('name');
    t.string('createdBy', { resolve: (workflow) => workflow.createdBy || null });
    t.string('updatedBy', { resolve: (workflow) => workflow.updatedBy || null });
    t.string('createdTime', {
      resolve: (workflow) => workflow.createdTime?.toISOString() || null,
    });
    t.string('updatedTime', {
      resolve: (workflow) => workflow.updatedTime?.toISOString() || null,
    });
  },
});

export const WorkflowEdge = objectType({
  name: 'WorkflowEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: Workflow,
    });
    t.nonNull.string('cursor');
  },
});

export const WorkflowConnection = objectType({
  name: 'WorkflowConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: WorkflowEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const WorkflowsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('worfklows', {
      type: WorkflowConnection,
      args: PaginationConnectionArgs,
      resolve: async (_, args, { conductorAPI }) => {
        const workflows = await conductorAPI.getWorkflowMetadata(config.conductorApiURL);

        const workflowsWithId = workflows.map((w) => ({
          ...w,
          id: w.name,
          createdBy: w.createdBy || null,
          updatedBy: w.updatedBy || null,
        }));
        return {
          ...connectionFromArray(workflowsWithId, args),
          totalCount: workflows.length,
        };
      },
    });
  },
});
