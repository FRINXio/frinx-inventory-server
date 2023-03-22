import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, intArg, nonNull, objectType, stringArg } from 'nexus';
import config from '../config';
import { WorkflowDetailInput } from '../external-api/conductor-network-types';
import { toGraphId } from '../helpers/id-helper';
import { validateTasks } from '../helpers/workflow-helpers';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Workflow = objectType({
  name: 'Workflow',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (workflow) => toGraphId('Workflow', workflow.name),
    });
    t.nonNull.string('name');
    t.string('createdBy', { resolve: (workflow) => workflow.createdBy ?? null });
    t.string('updatedBy', { resolve: (workflow) => workflow.updatedBy ?? null });
    t.string('createdAt', {
      resolve: (workflow) => (workflow.createTime ? new Date(workflow.createTime).toISOString() : null),
    });
    t.string('updatedAt', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.string('tasks', { resolve: (workflow) => JSON.stringify(workflow.tasks) });
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
        }));
        return {
          ...connectionFromArray(workflowsWithId, args),
          totalCount: workflows.length,
        };
      },
    });
  },
});

export const AddWorkflowPayload = objectType({
  name: 'AddWorkflowPayload',
  definition: (t) => {
    t.nonNull.field('workflow', { type: Workflow });
  },
});

const WorkflowInput = inputObjectType({
  name: 'WorkflowInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.int('timeoutSeconds');
    t.nonNull.string('tasks');
  },
});

export const AddWorkflowInput = inputObjectType({
  name: 'AddWorkflowInput',
  definition: (t) => {
    t.nonNull.field('workflow', {
      type: WorkflowInput,
    });
  },
});

export const AddWorkflowMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addWorkflow', {
      type: AddWorkflowPayload,
      args: {
        input: nonNull(arg({ type: AddWorkflowInput })),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { input } = args;
        const { workflow } = input;

        const parsedTasks = validateTasks(workflow.tasks);

        const apiWorkflow: WorkflowDetailInput = {
          name: workflow.name,
          timeoutSeconds: 60,
          tasks: parsedTasks,
        };

        await conductorAPI.createWorkflow(config.conductorApiURL, apiWorkflow);
        return {
          workflow: {
            id: toGraphId('Workflow', apiWorkflow.name),
            ...apiWorkflow,
          },
        };
      },
    });
  },
});

const DeleteWorkflowPayload = objectType({
  name: 'DeleteWorkflowPayload',
  definition: (t) => {
    t.nonNull.field('workflow', {
      type: Workflow,
    });
  },
});

export const DeleteWorkflowMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deleteWorkflow', {
      type: DeleteWorkflowPayload,
      args: {
        name: nonNull(stringArg()),
        version: nonNull(intArg()),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { name, version } = args;
        const workflowToDelete = await conductorAPI.getWorkflowDetail(config.conductorApiURL, name);
        await conductorAPI.deleteWorkflow(config.conductorApiURL, name, version);
        return {
          workflow: {
            ...workflowToDelete,
            id: toGraphId('Workflow', workflowToDelete.name),
          },
        };
      },
    });
  },
});
