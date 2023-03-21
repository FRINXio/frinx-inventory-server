import { connectionFromArray } from 'graphql-relay';
import { enumType, objectType, queryField } from 'nexus';
import { v4 as uuid } from 'uuid';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { ExecutedWorkflowTask } from './task';
import { Workflow } from './workflow';

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
    t.string('parentWorkflowTaskId');
    t.string('input', { resolve: (workflow) => JSON.stringify(workflow.input) });
    t.string('output', { resolve: (workflow) => JSON.stringify(workflow.output) });
    t.string('correlationId');
    t.string('reRunFromWorkflowId');
    t.string('reasonForIncompletion');
    t.string('event');
    t.string('taskToDomain', { resolve: (workflow) => JSON.stringify(workflow.taskToDomain) });
    t.list.string('failedReferenceTaskNames');
    t.field('workflowDefinition', { type: Workflow });
    t.string('externalInputPayloadStoragePath');
    t.string('externalOutputPayloadStoragePath');
    t.int('priority');
    t.string('variables', { resolve: (workflow) => JSON.stringify(workflow.variables) });
    t.string('lastRetriedTime', {
      resolve: (workflow) => (workflow.updateTime ? new Date(workflow.updateTime).toISOString() : null),
    });
    t.nullable.list.nullable.string('failedTaskNames');
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

export const ExecutedWorkflowsQuery = queryField('executedWorkflows', {
  type: ExecutedWorkflowConnection,
  args: PaginationConnectionArgs,
  resolve: async (_, args, { conductorAPI }) => {
    const executedWorkflows = await conductorAPI.getExecutedWorkflows(config.conductorApiURL, {});

    const executedWorkflowsWithId = executedWorkflows.map((w) => ({
      ...w,
      id: toGraphId('ExecutedWorkflow', w.workflowId || uuid()),
    }));
    return {
      ...connectionFromArray(executedWorkflowsWithId, args),
      totalCount: executedWorkflows.length,
    };
  },
});
