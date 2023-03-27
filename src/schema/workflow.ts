import { connectionFromArray } from 'graphql-relay';
import { booleanArg, extendType, list, mutationField, nonNull, objectType, stringArg } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
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

export const PauseWorkflowMutation = mutationField('pauseWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
  },
  resolve: async (_, { workflowId }, { conductorAPI }) => {
    try {
      await conductorAPI.pauseWorkflow(config.conductorApiURL, workflowId);

      return 'Workflow paused';
    } catch (error) {
      throw new Error("Workflow couldn't be paused");
    }
  },
});

export const ResumeWorkflowMutation = mutationField('resumeWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
  },
  resolve: async (_, { workflowId }, { conductorAPI }) => {
    try {
      await conductorAPI.resumeWorkflow(config.conductorApiURL, workflowId);

      return 'Workflow resumed';
    } catch (error) {
      throw new Error("Workflow couldn't be resumed");
    }
  },
});

export const BulkOperationResponse = objectType({
  name: 'BulkOperationResponse',
  definition: (t) => {
    t.string('bulkErrorResults');
    t.list.nonNull.string('bulkSuccessfulResults');
  },
});

export const BulkResumeWorkflowMutation = mutationField('bulkResumeWorkflow', {
  type: BulkOperationResponse,
  args: {
    workflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { workflowIds }, { conductorAPI }) => {
    try {
      const data = await conductorAPI.bulkResumeWorkflow(config.conductorApiURL, workflowIds);

      return {
        bulkErrorResults: JSON.stringify(data.bulkErrorResults),
        bulkSuccessfulResults: data.bulkSuccessfulResults,
      };
    } catch (error) {
      throw new Error('Bulk resume of workflows was not successful');
    }
  },
});

export const BulkPauseWorkflowMutation = mutationField('bulkPauseWorkflow', {
  type: BulkOperationResponse,
  args: {
    workflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { workflowIds }, { conductorAPI }) => {
    try {
      const data = await conductorAPI.bulkPauseWorkflow(config.conductorApiURL, workflowIds);

      return {
        bulkErrorResults: JSON.stringify(data.bulkErrorResults),
        bulkSuccessfulResults: data.bulkSuccessfulResults,
      };
    } catch (error) {
      throw new Error('Bulk pause of workflows was not successful');
    }
  },
});

export const RetryWorkflowMutation = mutationField('retryWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
    resumeSubworkflowTasks: booleanArg(),
  },
  resolve: async (_, { workflowId, resumeSubworkflowTasks }, { conductorAPI }) => {
    try {
      await conductorAPI.retryWorkflow(config.conductorApiURL, workflowId, resumeSubworkflowTasks);

      return 'Workflow retried';
    } catch (error) {
      throw new Error("Workflow couldn't be retried");
    }
  },
});

export const RestartWorkflowMutation = mutationField('restartWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
    useLatestDefinitions: booleanArg(),
  },
  resolve: async (_, { workflowId, useLatestDefinitions }, { conductorAPI }) => {
    try {
      await conductorAPI.restartWorkflow(config.conductorApiURL, workflowId, useLatestDefinitions);

      return 'Workflow retried';
    } catch (error) {
      throw new Error("Workflow couldn't be retried");
    }
  },
});

export const TerminateWorkflowMutation = mutationField('terminateWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
    reason: stringArg(),
  },
  resolve: async (_, { workflowId, reason }, { conductorAPI }) => {
    try {
      await conductorAPI.terminateWorkflow(config.conductorApiURL, workflowId, reason);

      return 'Workflow terminated';
    } catch (error) {
      throw new Error("Workflow couldn't be terminated");
    }
  },
});

export const RemoveWorkflowMutation = mutationField('removeWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
    archiveWorkflow: booleanArg(),
  },
  resolve: async (_, { workflowId, archiveWorkflow }, { conductorAPI }) => {
    try {
      await conductorAPI.removeWorkflow(config.conductorApiURL, workflowId, archiveWorkflow);

      return 'Workflow removed';
    } catch (error) {
      throw new Error("Workflow couldn't be removed");
    }
  },
});
