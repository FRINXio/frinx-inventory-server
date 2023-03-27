import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, list, mutationField, intArg, nonNull, objectType, stringArg } from 'nexus';
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
    t.string('description');
    t.int('version');
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
    t.nonNull.field('workflows', {
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

export const CreateWorkflowPayload = objectType({
  name: 'CreateWorkflowPayload',
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
    t.string('description');
    t.int('version');
  },
});

export const CreateWorkflowInput = inputObjectType({
  name: 'CreateWorkflowInput',
  definition: (t) => {
    t.nonNull.field('workflow', {
      type: WorkflowInput,
    });
  },
});

export const CreateWorkflowMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('createWorkflow', {
      type: CreateWorkflowPayload,
      args: {
        input: nonNull(arg({ type: CreateWorkflowInput })),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { input } = args;
        const { workflow } = input;

        const parsedTasks = validateTasks(workflow.tasks);

        const apiWorkflow: WorkflowDetailInput = {
          name: workflow.name,
          timeoutSeconds: 60,
          tasks: parsedTasks,
          version: workflow.version || undefined,
          description: workflow.description || undefined,
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

export const UpdateWorkflowPayload = objectType({
  name: 'UpdateWorkflowPayload',
  definition: (t) => {
    t.nonNull.field('workflow', { type: Workflow });
  },
});

export const UpdateWorkflowInput = inputObjectType({
  name: 'UpdateWorkflowInput',
  definition: (t) => {
    t.nonNull.field('workflow', {
      type: WorkflowInput,
    });
  },
});

export const UpdateWorkflowMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateWorkflow', {
      type: UpdateWorkflowPayload,
      args: {
        id: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateWorkflowInput })),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { input } = args;
        const { workflow } = input;

        const parsedTasks = validateTasks(workflow.tasks);

        const apiWorkflow: WorkflowDetailInput = {
          name: workflow.name,
          timeoutSeconds: 60,
          tasks: parsedTasks,
          version: workflow.version || undefined,
          description: workflow.description || undefined,
        };

        const result = await conductorAPI.editWorkflow(config.conductorApiURL, apiWorkflow);

        if (result.bulkErrorResults[workflow.name]) {
          throw new Error(`update workflow error: ${result.bulkErrorResults[workflow.name]}`);
        }

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
