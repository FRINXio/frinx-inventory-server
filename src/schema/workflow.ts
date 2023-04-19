import { connectionFromArray } from 'graphql-relay';
import { v4 as uuid } from 'uuid';
import {
  arg,
  booleanArg,
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
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import getLogger from '../get-logger';
import { IsOkResponse, Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { TaskInput, ExecutedWorkflowTask } from './task';
import {
  getFilteredWorkflows,
  getSubworkflows,
  makePaginationFromArgs,
  makeSearchQueryFromArgs,
  validateTasks,
} from '../helpers/workflow.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import { parseJson, unwrap } from '../helpers/utils.helpers';

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
    t.list.nonNull.string('inputParameters', { resolve: (w) => w.inputParameters ?? null });
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

export const FilterWorkflowsInput = inputObjectType({
  name: 'FilterWorkflowsInput',
  definition: (t) => {
    t.list.nonNull.string('labels');
    t.string('keyword');
  },
});

export const WorkflowsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('workflows', {
      type: WorkflowConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: FilterWorkflowsInput,
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { filter, ...paginationArgs } = args;
        const workflows = await conductorAPI.getWorkflowMetadata(config.conductorApiURL);

        const filteredWorkflows =
          filter?.labels || filter?.keyword ? getFilteredWorkflows(workflows, filter) : workflows;

        const workflowsWithId = filteredWorkflows.map((w) => ({
          ...w,
          id: w.name,
        }));
        return {
          ...connectionFromArray(workflowsWithId, paginationArgs),
          totalCount: filteredWorkflows.length,
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
    t.list.nonNull.field('tasks', {
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

const SubWorkflow = objectType({
  name: 'SubWorkflow',
  definition: (t) => {
    t.nonNull.string('taskReferenceName');
    t.nonNull.field('workflowDetail', { type: Workflow });
    t.nonNull.field('executedWorkflowDetail', { type: ExecutedWorkflow });
  },
});

const WorkflowInstanceDetail = objectType({
  name: 'WorkflowInstanceDetail',
  definition: (t) => {
    t.nonNull.field('result', { type: ExecutedWorkflow });
    t.field('meta', { type: Workflow });
    t.field('subworkflows', { type: list(nonNull(SubWorkflow)) });
  },
});

export const WorkflowInstanceQuery = queryField('workflowInstanceDetail', {
  type: WorkflowInstanceDetail,
  args: {
    id: nonNull(stringArg()),
    shouldIncludeTasks: booleanArg(),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { id, shouldIncludeTasks } = args;
    const workflowId = fromGraphId('ExecutedWorkflow', id);

    const result = await conductorAPI.getExecutedWorkflowDetail(
      config.conductorApiURL,
      workflowId,
      shouldIncludeTasks ?? false,
    );

    const meta = result.workflowDefinition
      ? null
      : await conductorAPI.getWorkflowDetail(
          config.conductorApiURL,
          unwrap(result.workflowName || null),
          result.workflowVersion || undefined,
        );

    const subworkflows = await getSubworkflows({
      ...result,
      id: toGraphId('ExecutedWorkflow', unwrap(result.workflowName || null)),
    });

    return {
      result: { ...result, id: toGraphId('ExecutedWorkflow', unwrap(result.workflowName || null)) },
      meta: meta ? { ...meta, id: toGraphId('Workflow', meta.name) } : null,
      subworkflows,
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
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
  },
  resolve: async (_, { workflowId }, { conductorAPI }) => {
    await conductorAPI.pauseWorkflow(config.conductorApiURL, workflowId);

    return { isOk: true };
  },
});

export const ResumeWorkflowMutation = mutationField('resumeWorkflow', {
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
  },
  resolve: async (_, { workflowId }, { conductorAPI }) => {
    await conductorAPI.resumeWorkflow(config.conductorApiURL, workflowId);

    return { isOk: true };
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
    executedWorkflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { executedWorkflowIds }, { conductorAPI }) => {
    const nativeWorkflowIds = executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkPauseWorkflow(config.conductorApiURL, nativeWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});

export const BulkTerminateWorkflow = mutationField('bulkTerminateWorkflow', {
  type: BulkOperationResponse,
  args: {
    executedWorkflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { executedWorkflowIds }, { conductorAPI }) => {
    const nativeWorkflowIds = executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkTerminateWorkflow(config.conductorApiURL, nativeWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});

export const BulkRetryWorkflow = mutationField('bulkRetryWorkflow', {
  type: BulkOperationResponse,
  args: {
    executedWorkflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { executedWorkflowIds }, { conductorAPI }) => {
    const nativeWorkflowIds = executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkRetryWorkflow(config.conductorApiURL, nativeWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});

export const BulkRestartWorkflow = mutationField('bulkRestartWorkflow', {
  type: BulkOperationResponse,
  args: {
    executedWorkflowIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { executedWorkflowIds }, { conductorAPI }) => {
    const nativeWorkflowIds = executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkRestartWorkflow(config.conductorApiURL, nativeWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults,
    };
  },
});

export const RetryWorkflowMutation = mutationField('retryWorkflow', {
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
    shouldResumeSubworkflowTasks: booleanArg({ description: 'Default value is true' }),
  },
  resolve: async (_, { workflowId, shouldResumeSubworkflowTasks }, { conductorAPI }) => {
    await conductorAPI.retryWorkflow(config.conductorApiURL, workflowId, shouldResumeSubworkflowTasks);

    return { isOk: true };
  },
});

export const RestartWorkflowMutation = mutationField('restartWorkflow', {
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
    shouldUseLatestDefinitions: booleanArg({ description: 'Default value is true' }),
  },
  resolve: async (_, { workflowId, shouldUseLatestDefinitions }, { conductorAPI }) => {
    await conductorAPI.restartWorkflow(config.conductorApiURL, workflowId, shouldUseLatestDefinitions);

    return { isOk: true };
  },
});

export const TerminateWorkflowMutation = mutationField('terminateWorkflow', {
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
    reason: stringArg(),
  },
  resolve: async (_, { workflowId, reason }, { conductorAPI }) => {
    await conductorAPI.terminateWorkflow(config.conductorApiURL, workflowId, reason);

    return { isOk: true };
  },
});

export const RemoveWorkflowMutation = mutationField('removeWorkflow', {
  type: IsOkResponse,
  args: {
    workflowId: nonNull(stringArg()),
    shouldArchiveWorkflow: booleanArg({ description: 'Default value is true' }),
  },
  resolve: async (_, { workflowId, shouldArchiveWorkflow }, { conductorAPI }) => {
    await conductorAPI.removeWorkflow(config.conductorApiURL, workflowId, shouldArchiveWorkflow);

    return { isOk: true };
  },
});
