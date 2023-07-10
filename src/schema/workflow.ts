import { v4 as uuid } from 'uuid';
import {
  arg,
  booleanArg,
  enumType,
  extendType,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
  subscriptionField,
} from 'nexus';
import config from '../config';
import { WorkflowDetailInput } from '../external-api/conductor-network-types';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import getLogger from '../get-logger';
import { IsOkResponse, Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { TaskInput, ExecutedWorkflowTask } from './task';
import {
  convertToApiOutputParameters,
  getFilteredWorkflows,
  getSubworkflows,
  makePaginationFromArgs,
  makeSearchQueryFromArgs,
  validateTasks,
} from '../helpers/workflow.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import { omitNullValue, parseJson } from '../helpers/utils.helpers';
import { connectionFromArray } from '../helpers/connection.helpers';
import { asyncGenerator } from '../helpers/conductor.helpers';

const log = getLogger('frinx-inventory-server');

export const ScheduleFilterInput = inputObjectType({
  name: 'ScheduleFilterInput',
  definition: (t) => {
    t.nonNull.string('workflowName');
    t.nonNull.string('workflowVersion');
  },
});

const OutputParameter = objectType({
  name: 'OutputParameter',
  definition: (t) => {
    t.nonNull.string('key');
    t.nonNull.string('value');
  },
});

export const TimeoutPolicy = enumType({
  name: 'TimeoutPolicy',
  members: ['TIME_OUT_WF', 'ALERT_ONLY'],
});

export const Workflow = objectType({
  name: 'Workflow',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (workflow) => toGraphId('Workflow', workflow.name),
    });
    t.nonNull.int('timeoutSeconds');
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
    t.list.nonNull.field('outputParameters', {
      type: OutputParameter,
      resolve: (w) =>
        w.outputParameters
          ? Object.entries(w.outputParameters).map((e) => ({
              key: e[0],
              value: JSON.stringify(e[1]),
            }))
          : null,
    });
    t.boolean('hasSchedule', {
      resolve: async (workflow, _, { schedulerAPI }) => {
        try {
          const { schedules } = await schedulerAPI.getSchedules(
            {},
            {
              workflowName: workflow.name,
              workflowVersion: workflow.version?.toString() ?? '1',
            },
          );

          if (schedules == null) {
            return false;
          }

          return schedules.edges.length > 0;
        } catch (e) {
          log.info(`cannot get schedule info for workflow ${workflow.name}: ${e}`);
          return false;
        }
      },
    });
    t.boolean('restartable');
    t.field('timeoutPolicy', { type: TimeoutPolicy });
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
      resolve: (root) => toGraphId('ExecutedWorkflow', root.workflowId),
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
    t.nonNull.string('workflowId');
    t.list.nonNull.field('tasks', {
      type: ExecutedWorkflowTask,
    });
    t.string('correlationId');
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
        id: toGraphId('ExecutedWorkflow', w.workflowId),
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
    t.nonNull.string('referenceTaskName');
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
    workflowId: nonNull(stringArg()),
    shouldIncludeTasks: booleanArg(),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { workflowId, shouldIncludeTasks } = args;

    const result = await conductorAPI.getExecutedWorkflowDetail(
      config.conductorApiURL,
      fromGraphId('ExecutedWorkflow', workflowId),
      shouldIncludeTasks ?? false,
    );

    if (result.workflowName == null) {
      throw new Error(`Workflow not found`);
    }

    const meta = result.workflowDefinition
      ? null
      : await conductorAPI.getWorkflowDetail(
          config.conductorApiURL,
          result.workflowName,
          result.workflowVersion || undefined,
        );

    const subworkflows = await getSubworkflows({
      ...result,
      id: toGraphId('ExecutedWorkflow', result.workflowId),
    });

    return {
      result: { ...result, id: toGraphId('ExecutedWorkflow', uuid()) },
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

const OutputParameterInput = inputObjectType({
  name: 'OutputParameterInput',
  definition: (t) => {
    t.nonNull.string('key');
    t.nonNull.string('value');
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
    t.boolean('restartable');
    t.list.nonNull.field({ name: 'outputParameters', type: OutputParameterInput });
    t.string('createdAt');
    t.string('updatedAt');
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
        const outputParameters = convertToApiOutputParameters(workflow.outputParameters);

        const apiWorkflow: WorkflowDetailInput = {
          name: workflow.name,
          timeoutSeconds: 60,
          tasks: parsedTasks,
          version: workflow.version || undefined,
          description: workflow.description || undefined,
          restartable: workflow.restartable || undefined,
          outputParameters: outputParameters || undefined,
          createTime: workflow.createdAt ? Date.parse(workflow.createdAt) : undefined,
          updateTime: workflow.updatedAt ? Date.parse(workflow.updatedAt) : undefined,
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

const DeleteWorkflowInput = inputObjectType({
  name: 'DeleteWorkflowInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.int('version');
  },
});

export const DeleteWorkflowMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('deleteWorkflow', {
      type: DeleteWorkflowPayload,
      args: {
        input: nonNull(arg({ type: DeleteWorkflowInput })),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { input } = args;
        const workflowToDelete = await conductorAPI.getWorkflowDetail(config.conductorApiURL, input.name);
        await conductorAPI.deleteWorkflow(config.conductorApiURL, input.name, input.version);
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
    id: nonNull(stringArg()),
  },
  resolve: async (_, { id }, { conductorAPI }) => {
    await conductorAPI.pauseWorkflow(config.conductorApiURL, fromGraphId('ExecutedWorkflow', id));

    return { isOk: true };
  },
});

export const ResumeWorkflowMutation = mutationField('resumeWorkflow', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
  },
  resolve: async (_, { id }, { conductorAPI }) => {
    await conductorAPI.resumeWorkflow(config.conductorApiURL, fromGraphId('ExecutedWorkflow', id));

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

const BulkOperationInput = inputObjectType({
  name: 'BulkOperationInput',
  definition: (t) => {
    t.nonNull.list.nonNull.string('executedWorkflowIds');
  },
});

export const BulkResumeWorkflowMutation = mutationField('bulkResumeWorkflow', {
  type: BulkOperationResponse,
  args: {
    input: nonNull(arg({ type: BulkOperationInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const executedWorkflowIds = input.executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkResumeWorkflow(config.conductorApiURL, executedWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults.map((id) => toGraphId('ExecutedWorkflow', id)),
    };
  },
});

const ExecuteWorkflowByNameInput = inputObjectType({
  name: 'ExecuteWorkflowByName',
  definition: (t) => {
    t.nonNull.string('inputParameters', { description: 'JSON string of input parameters' });
    t.nonNull.string('workflowName');
    t.int('workflowVersion');
    t.string('correlationId');
    t.int('priority');
  },
});

export const ExecuteWorkflowByName = mutationField('executeWorkflowByName', {
  type: 'String',
  args: {
    input: nonNull(arg({ type: ExecuteWorkflowByNameInput })),
  },
  resolve: async (
    _,
    { input: { inputParameters, workflowName, workflowVersion, correlationId, priority } },
    { conductorAPI },
  ) => {
    const json = parseJson<Record<string, unknown>>(inputParameters);

    if (json == null) {
      throw new Error('inputParameters must be a valid JSON string');
    }

    const workflowId = await conductorAPI.executeWorkflowByName(config.conductorApiURL, {
      inputParameters: json,
      name: workflowName,
      version: workflowVersion,
      correlationId,
      priority,
    });

    return toGraphId('ExecutedWorkflow', workflowId);
  },
});

export const BulkPauseWorkflowMutation = mutationField('bulkPauseWorkflow', {
  type: BulkOperationResponse,
  args: {
    input: nonNull(arg({ type: BulkOperationInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const executedWorkflowIds = input.executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkPauseWorkflow(config.conductorApiURL, executedWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults.map((id) => toGraphId('ExecutedWorkflow', id)),
    };
  },
});

export const BulkTerminateWorkflow = mutationField('bulkTerminateWorkflow', {
  type: BulkOperationResponse,
  args: {
    input: nonNull(arg({ type: BulkOperationInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const executedWorkflowIds = input.executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkTerminateWorkflow(config.conductorApiURL, executedWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults.map((id) => toGraphId('ExecutedWorkflow', id)),
    };
  },
});

export const BulkRetryWorkflow = mutationField('bulkRetryWorkflow', {
  type: BulkOperationResponse,
  args: {
    input: nonNull(arg({ type: BulkOperationInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const executedWorkflowIds = input.executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkRetryWorkflow(config.conductorApiURL, executedWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults.map((id) => toGraphId('ExecutedWorkflow', id)),
    };
  },
});

export const BulkRestartWorkflow = mutationField('bulkRestartWorkflow', {
  type: BulkOperationResponse,
  args: {
    input: nonNull(arg({ type: BulkOperationInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    const executedWorkflowIds = input.executedWorkflowIds.map((id) => fromGraphId('ExecutedWorkflow', id));
    const data = await conductorAPI.bulkRestartWorkflow(config.conductorApiURL, executedWorkflowIds);

    return {
      bulkErrorResults: JSON.stringify(data.bulkErrorResults),
      bulkSuccessfulResults: data.bulkSuccessfulResults.map((id) => toGraphId('ExecutedWorkflow', id)),
    };
  },
});

const RetryWorkflowInput = inputObjectType({
  name: 'RetryWorkflowInput',
  definition: (t) => {
    t.boolean('shouldResumeSubworkflowTasks', { description: 'Default value is true' });
  },
});

export const RetryWorkflowMutation = mutationField('retryWorkflow', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
    input: arg({ type: RetryWorkflowInput }),
  },
  resolve: async (_, { id, input }, { conductorAPI }) => {
    await conductorAPI.retryWorkflow(
      config.conductorApiURL,
      fromGraphId('ExecutedWorkflow', id),
      input?.shouldResumeSubworkflowTasks,
    );

    return { isOk: true };
  },
});

const RestartWorkflowInput = inputObjectType({
  name: 'RestartWorkflowInput',
  definition: (t) => {
    t.boolean('shouldUseLatestDefinitions', { description: 'Default value is true' });
  },
});

export const RestartWorkflowMutation = mutationField('restartWorkflow', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
    input: arg({ type: RestartWorkflowInput }),
  },
  resolve: async (_, { id, input }, { conductorAPI }) => {
    await conductorAPI.restartWorkflow(
      config.conductorApiURL,
      fromGraphId('ExecutedWorkflow', id),
      input?.shouldUseLatestDefinitions,
    );

    return { isOk: true };
  },
});

const TerminateWorkflowInput = inputObjectType({
  name: 'TerminateWorkflowInput',
  definition: (t) => {
    t.string('reason');
  },
});

export const TerminateWorkflowMutation = mutationField('terminateWorkflow', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
    input: arg({ type: TerminateWorkflowInput }),
  },
  resolve: async (_, { id, input }, { conductorAPI }) => {
    await conductorAPI.terminateWorkflow(config.conductorApiURL, fromGraphId('ExecutedWorkflow', id), input?.reason);

    return { isOk: true };
  },
});

const RemoveWorkflowInput = inputObjectType({
  name: 'RemoveWorkflowInput',
  definition: (t) => {
    t.boolean('shouldArchiveWorkflow', { description: 'Default value is true' });
  },
});

export const RemoveWorkflowMutation = mutationField('removeWorkflow', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
    input: arg({ type: RemoveWorkflowInput }),
  },
  resolve: async (_, { id, input }, { conductorAPI }) => {
    await conductorAPI.removeWorkflow(
      config.conductorApiURL,
      fromGraphId('ExecutedWorkflow', id),
      input?.shouldArchiveWorkflow,
    );

    return { isOk: true };
  },
});

export const CreateScheduleInput = inputObjectType({
  name: 'CreateScheduleInput',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.string('workflowName');
    t.nonNull.string('workflowVersion');
    t.nonNull.string('cronString');
    t.string('workflowContext');
    t.boolean('isEnabled');
    t.string('performFromDate');
    t.string('performTillDate');
    t.boolean('parallelRuns');
  },
});

export const ScheduleStatus = enumType({
  name: 'ScheduleStatus',
  members: ['UNKNOWN', 'COMPLETED', 'FAILED', 'PAUSED', 'RUNNING', 'TERMINATED', 'TIMED_OUT'],
});

export const Schedule = objectType({
  name: 'Schedule',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Schedule', root.name),
    });
    t.nonNull.string('name');
    t.nonNull.string('workflowName');
    t.nonNull.string('workflowVersion');
    t.nonNull.string('cronString');
    t.nonNull.string('workflowContext');
    t.nonNull.boolean('isEnabled', {
      resolve: (root) => root.enabled,
    });
    t.nonNull.string('performFromDate', {
      resolve: (root) => root.fromDate,
    });
    t.nonNull.string('performTillDate', {
      resolve: (root) => root.toDate,
    });
    t.nonNull.boolean('parallelRuns');
    t.nonNull.field('status', {
      type: ScheduleStatus,
      resolve: (root) => root.status,
    });
  },
});

export const ScheduleWorkflow = mutationField('scheduleWorkflow', {
  type: Schedule,
  args: {
    input: nonNull(arg({ type: CreateScheduleInput })),
  },
  resolve: async (_, { input }, { schedulerAPI }) => {
    const response = await schedulerAPI.createWorkflowSchedule({
      fromDate: input.performFromDate,
      toDate: input.performTillDate,
      enabled: input.isEnabled,
      cronString: input.cronString,
      name: input.name,
      workflowName: input.workflowName,
      workflowVersion: input.workflowVersion,
      workflowContext: input.workflowContext,
      parallelRuns: input.parallelRuns,
    });

    return {
      ...response,
      id: toGraphId('Schedule', response.name),
    };
  },
});

export const EditWorkflowScheduleInput = inputObjectType({
  name: 'EditWorkflowScheduleInput',
  definition(t) {
    t.string('workflowName');
    t.string('workflowVersion');
    t.string('cronString');
    t.string('workflowContext');
    t.boolean('isEnabled');
    t.string('performFromDate');
    t.string('performTillDate');
    t.boolean('parallelRuns');
  },
});

export const EditWorkflowSchedule = mutationField('editWorkflowSchedule', {
  type: Schedule,
  args: {
    input: nonNull(arg({ type: EditWorkflowScheduleInput })),
    id: nonNull(stringArg()),
  },
  resolve: async (_, { input, id }, { schedulerAPI }) => {
    const name = fromGraphId('Schedule', id);
    const response = await schedulerAPI.editWorkflowSchedule(name, {
      fromDate: input.performFromDate,
      toDate: input.performTillDate,
      enabled: input.isEnabled,
      cronString: input.cronString,
      workflowName: input.workflowName,
      workflowVersion: input.workflowVersion,
      workflowContext: input.workflowContext,
      parallelRuns: input.parallelRuns,
    });

    return {
      ...response,
      id: toGraphId('Schedule', response.name),
    };
  },
});

export const ScheduleEdge = objectType({
  name: 'ScheduleEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: Schedule,
    });
    t.nonNull.string('cursor');
  },
});

export const ScheduleConnection = objectType({
  name: 'ScheduleConnection',
  definition: (t) => {
    t.nonNull.list.field('edges', {
      type: ScheduleEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const WorkflowSchedules = queryField('schedules', {
  type: nonNull(ScheduleConnection),
  args: {
    ...PaginationConnectionArgs,
    filter: arg({
      type: ScheduleFilterInput,
    }),
  },
  resolve: async (_, { filter, ...args }, { schedulerAPI }) => {
    const { schedules } = await schedulerAPI.getSchedules(args, filter);

    if (schedules == null || schedules.edges == null) {
      throw new Error('No schedules found');
    }

    return {
      totalCount: schedules.totalCount,
      edges: schedules.edges.filter(omitNullValue).map((schedule) => ({
        ...schedule,
        node: {
          ...schedule.node,
          id: toGraphId('Schedule', schedule.node.name),
        },
      })),
      pageInfo: schedules.pageInfo,
    };
  },
});

export const DeleteSchedule = mutationField('deleteSchedule', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
  },
  resolve: async (_, { id }, { schedulerAPI }) => {
    try {
      const name = fromGraphId('Schedule', id);
      await schedulerAPI.deleteSchedule(name);

      return {
        isOk: true,
      };
    } catch (error) {
      return {
        isOk: false,
      };
    }
  },
});

export const ExecutedWorkflowSubscription = subscriptionField('controlExecutedWorkflow', {
  type: ExecutedWorkflow,
  args: {
    id: nonNull(stringArg()),
  },
  subscribe: (_, { id }, { conductorAPI }) =>
    asyncGenerator({
      repeatTill: (workflow) => workflow?.status === 'RUNNING' || workflow?.status === 'PAUSED',
      fn: () =>
        conductorAPI.getExecutedWorkflowDetail(config.conductorApiURL, fromGraphId('ExecutedWorkflow', id), true),
    }),
  resolve: (workflow) => {
    if (workflow == null) {
      return null;
    }

    return {
      ...workflow,
      id: toGraphId('ExecutedWorkflow', workflow.workflowId),
    };
  },
});
