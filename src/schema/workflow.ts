import { connectionFromArray } from 'graphql-relay';
import { v4 as uuid } from 'uuid';
import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from 'nexus';
import config from '../config';
import { WorkflowDetailInput } from '../external-api/conductor-network-types';
import { toGraphId } from '../helpers/id-helper';
import { validateTasks } from '../helpers/workflow-helpers';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { TaskInput, ExecutedWorkflowTask } from './task';
import { makePaginationFromArgs, makeSearchQueryFromArgs } from '../helpers/workflow.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import { parseJson } from '../helpers/utils.helpers';
import getLogger from '../get-logger';

const log = getLogger('frinx-inventory-server');

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
    t.boolean('hasSchedule', {
      resolve: async (workflow, _, { schedulerAPI }) => {
        try {
          await schedulerAPI.getSchedule(config.schedulerApiURL, workflow.name, workflow.version ?? 1);
          return true;
        } catch (e) {
          log.info(`cannot get schedule info for workflow ${workflow.name}: ${e}`);
          return false;
        }
      },
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

export const TimeoutPolicy = enumType({
  name: 'TimeoutPolicy',
  members: ['TIME_OUT_WF', 'ALERT_ONLY'],
});

export const WorkflowDefinitionInput = inputObjectType({
  name: 'WorkflowDefinitionInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.list.nonNull.field('tasks', {
      type: TaskInput,
    });
    t.nonNull.int('timeoutSeconds');
    t.list.string('inputParameters');
    t.string('outputParameters');
    t.string('description');
    t.int('version');
    t.int('schemaVersion');
    t.string('ownerApp');
    t.string('ownerEmail');
    t.string('variables');
    t.string('inputTemplate');
    t.boolean('restartable');
    t.field('timeoutPolicy', {
      type: TimeoutPolicy,
    });
    t.int('createdAt');
    t.int('updatedAt');
    t.int('createTime');
    t.int('updateTime');
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const ExecutedWorkflowStatus = enumType({
  name: 'ExecutedWorkflowStatus',
  members: ['RUNNING', 'COMPLETED', 'FAILED', 'TERMINATED', 'TIMED_OUT', 'PAUSED'],
});

export const ExecutedWorkflow = objectType({
  name: 'ExecutedWorkflow',
  definition(t) {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (executedWorkflow) => toGraphId('ExecutedWorkflow', executedWorkflow.workflowId ?? uuid()),
    });
    t.string('createdBy', { resolve: (executedWorkflow) => executedWorkflow.createdBy ?? null });
    t.string('updatedBy', { resolve: (workflow) => workflow.updatedBy ?? null });
    t.string('createdAt', {
      resolve: (workflow) => (workflow.createTime ? new Date(workflow.createTime).toISOString() : null),
    });
    t.string('updatedAt', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.field('status', { type: ExecutedWorkflowStatus });
    t.string('parentWorkflowId');
    t.string('ownerApp');
    t.string('input', { resolve: (workflow) => JSON.stringify(workflow.input) });
    t.string('output', { resolve: (workflow) => JSON.stringify(workflow.output) });
    t.string('reasonForIncompletion');
    t.list.string('failedReferenceTaskNames');
    t.field('workflowDefinition', { type: Workflow });
    t.string('variables', { resolve: (workflow) => JSON.stringify(workflow.variables) });
    t.string('lastRetriedTime', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.string('startTime', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.string('endTime', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.int('workflowVersion');
    t.string('workflowName');
    t.string('workflowId');
    t.list.field('tasks', {
      type: ExecutedWorkflowTask,
    });
  },
});

export const ExecutedWorkflowEdge = objectType({
  name: 'ExecutedWorkflowEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: ExecutedWorkflow,
    });
    t.nonNull.string('cursor');
  },
});

export const ExecutedWorkflowConnection = objectType({
  name: 'ExecutedWorkflowConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: ExecutedWorkflowEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const ExecutedWorkflowStartTimeRange = inputObjectType({
  name: 'ExecutedWorkflowStartTimeRange',
  definition: (t) => {
    t.nonNull.string('from');
    t.string('to');
  },
});

export const ExecutedWorkflowFilterInput = inputObjectType({
  name: 'ExecutedWorkflowFilterInput',
  definition: (t) => {
    t.list.nonNull.string('workflowId');
    t.list.nonNull.string('workflowType');
    t.list.nonNull.field('status', { type: ExecutedWorkflowStatus });
    t.field('startTime', { type: ExecutedWorkflowStartTimeRange });
  },
});

export const ExecutedWorkflowSearchInput = inputObjectType({
  name: 'ExecutedWorkflowSearchInput',
  definition: (t) => {
    t.boolean('isRootWorkflow');
    t.field('query', { type: ExecutedWorkflowFilterInput });
  },
});

export const PaginationArgs = inputObjectType({
  name: 'PaginationArgs',
  definition: (t) => {
    t.nonNull.int('size');
    t.nonNull.int('start');
  },
});

export const ExecutedWorkflowsQuery = queryField('executedWorkflows', {
  type: ExecutedWorkflowConnection,
  args: {
    pagination: arg({ type: PaginationArgs }),
    searchQuery: arg({ type: ExecutedWorkflowSearchInput }),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { results: executedWorkflows } = await conductorAPI.getExecutedWorkflows(
      config.conductorApiURL,
      makeSearchQueryFromArgs(args.searchQuery),
      makePaginationFromArgs(args.pagination),
    );

    const executedWorkflowsWithId = executedWorkflows
      .map((w) => ({
        ...w,
        id: toGraphId('ExecutedWorkflow', w.workflowId || uuid()),
      }))
      .slice(0, args.pagination?.size ?? 0 - 1);

    return {
      edges: executedWorkflowsWithId.map((w) => ({
        node: w,
        cursor: w.id,
      })),
      pageInfo: {
        hasNextPage: args.pagination ? executedWorkflowsWithId.length < executedWorkflows.length : false,
        hasPreviousPage: args.pagination ? args.pagination.start >= args.pagination.size : false,
        endCursor: executedWorkflowsWithId[executedWorkflowsWithId.length - 1]?.id,
        startCursor: executedWorkflowsWithId[0]?.id,
      },
      totalCount: executedWorkflows.length,
    };
  },
});

export const ExecuteNewWorkflowInput = inputObjectType({
  name: 'ExecuteNewWorkflowInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.int('version');
    t.string('correlationId');
    t.string('input');
    t.string('taskToDomain');
    t.string('externalInputPayloadStoragePath');
    t.int('priority');
  },
});

export const StartWorkflowRequestInput = inputObjectType({
  name: 'StartWorkflowRequestInput',
  definition: (t) => {
    t.nonNull.field('workflow', {
      type: ExecuteNewWorkflowInput,
    });
    t.field('workflowDefinition', {
      type: WorkflowDefinitionInput,
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

export const ExecuteNewWorkflow = mutationField('executeNewWorkflow', {
  type: 'String',
  args: {
    input: nonNull(arg({ type: StartWorkflowRequestInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const { workflow, workflowDefinition } = input;

    let newWorkflow: StartWorkflowInput;

    try {
      newWorkflow = {
        ...workflow,
        input: parseJson(workflow.input),
        taskToDomain: parseJson(workflow.taskToDomain),
        ...(workflowDefinition && {
          workflowDef: {
            ...workflowDefinition,
            inputTemplate: parseJson(workflowDefinition.inputTemplate),
            outputParameters: parseJson(workflowDefinition.outputParameters),
            variables: parseJson(workflowDefinition.variables),
            tasks: workflowDefinition.tasks.map((t) => ({
              ...t,
              inputParameters: parseJson<Record<string, unknown>>(t.inputParameters),
              decisionCases: parseJson<Record<string, unknown[]>>(t.decisionCases),
              defaultCase: parseJson<unknown[]>(t.defaultCase),
            })),
          },
        }),
      };
    } catch (error) {
      throw new Error(`Invalid JSON: ${error}`);
    }

    const workflowId = await conductorAPI.executeNewWorkflow(config.conductorApiURL, newWorkflow);

    return workflowId;
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
    await conductorAPI.pauseWorkflow(config.conductorApiURL, workflowId);

    return 'Workflow paused';
  },
});

export const ResumeWorkflowMutation = mutationField('resumeWorkflow', {
  type: 'String',
  args: {
    workflowId: nonNull(stringArg()),
  },
  resolve: async (_, { workflowId }, { conductorAPI }) => {
    await conductorAPI.resumeWorkflow(config.conductorApiURL, workflowId);

    return 'Workflow resumed';
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
    const data = await conductorAPI.bulkResumeWorkflow(config.conductorApiURL, workflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});

export const ExecuteWorkflowByName = mutationField('executeWorkflowByName', {
  type: 'String',
  args: {
    inputParameters: nonNull(stringArg({ description: 'JSON string of input parameters' })),
    workflowName: nonNull(stringArg()),
    workflowVersion: intArg(),
    correlationId: stringArg(),
    priority: intArg(),
  },
  resolve: async (_, { inputParameters, workflowName, workflowVersion, correlationId, priority }, { conductorAPI }) => {
    const workflowId = await conductorAPI.executeWorkflowByName(config.conductorApiURL, {
      inputParameters: parseJson(inputParameters),
      name: workflowName,
      version: workflowVersion,
      correlationId,
      priority,
    });

    return workflowId;
  },
});

export const BulkPauseWorkflowMutation = mutationField('bulkPauseWorkflow', {
  type: BulkOperationResponse,
  args: {
    workflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { workflowIds }, { conductorAPI }) => {
    const data = await conductorAPI.bulkPauseWorkflow(config.conductorApiURL, workflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});
