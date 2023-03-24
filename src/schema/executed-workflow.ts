import { arg, enumType, inputObjectType, mutationField, nonNull, objectType, queryField } from 'nexus';
import { v4 as uuid } from 'uuid';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { parseJson } from '../helpers/utils.helpers';
import { makePaginationFromArgs, makeSearchQueryFromArgs } from '../helpers/workflow.helpers';
import { ExecuteNewWorkflowPayload } from '../types/conductor.types';
import { Node, PageInfo } from './global-types';
import { ExecutedWorkflowTask } from './task';
import { ExecuteWorkflowDefinitionInputPayload, Workflow } from './workflow';

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

export const ExecuteNewWorkflowInputPayload = inputObjectType({
  name: 'ExecuteNewWorkflowInputPayload',
  definition: (t) => {
    t.nonNull.string('name');
    t.int('version');
    t.string('correlationId');
    t.string('input');
    t.string('taskToDomain');
    t.string('externalInputPayloadStoragePath');
    t.int('priority');
    t.field('workflowDef', { type: ExecuteWorkflowDefinitionInputPayload });
  },
});

export const ExecuteNewWorkflow = mutationField('executeNewWorkflow', {
  type: 'String',
  args: {
    input: nonNull(arg({ type: ExecuteNewWorkflowInputPayload })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    try {
      const workflow: ExecuteNewWorkflowPayload = {
        ...input,
        input: input.input ? parseJson(input.input) : undefined,
        taskToDomain: input.taskToDomain ? parseJson(input.taskToDomain) : undefined,
        ...(input.workflowDef && {
          workflowDef: {
            ...input.workflowDef,
            inputParameters: input.workflowDef.inputParameters,
            outputParameters: input.workflowDef.outputParameters
              ? parseJson(input.workflowDef.outputParameters)
              : undefined,
            variables: input.workflowDef.variables ? parseJson(input.workflowDef.variables) : undefined,
            inputTemplate: input.workflowDef.inputTemplate ? parseJson(input.workflowDef.inputTemplate) : undefined,
            tasks: input.workflowDef.tasks.map((task) => ({
              ...task,
              decisionCases: task.decisionCases ? parseJson(task.decisionCases) : undefined,
              defaultCase: task.defaultCase ? parseJson(task.defaultCase) : undefined,
              inputParameters: task.inputParameters
                ? parseJson<Record<string, unknown>>(task.inputParameters)
                : undefined,
            })),
          },
        }),
      };

      const workflowId = await conductorAPI.executeNewWorkflow(config.conductorApiURL, workflow);

      return workflowId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new Error('We could not execute the workflow');
    }
  },
});
