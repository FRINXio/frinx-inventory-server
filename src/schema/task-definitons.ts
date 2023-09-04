import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from 'nexus';
import { orderBy } from 'lodash';
import config from '../config';
import { filterPollData, makeFromApiToGraphQLPollData } from '../helpers/task.helpers';
import { toGraphId } from '../helpers/id-helper';
import { getTaskDefinitionInput, getFilteredTaskDefinitions } from '../helpers/task-definition.helpers';
import { IsOkResponse, Node, PageInfo, PaginationConnectionArgs, SortDirection } from './global-types';
import { connectionFromArray } from '../helpers/connection.helpers';

const TaskTimeoutPolicy = enumType({
  name: 'TaskTimeoutPolicy',
  members: ['RETRY', 'TIME_OUT_WF', 'ALERT_ONLY'],
});

const RetryLogic = enumType({
  name: 'RetryLogic',
  members: ['FIXED', 'EXPONENTIAL_BACKOFF', 'LINEAR_BACKOFF'],
});

export const TaskDefinition = objectType({
  name: 'TaskDefinition',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (taskDefinition) => toGraphId('TaskDefinition', taskDefinition.name),
    });
    t.nonNull.string('name');
    t.nonNull.int('timeoutSeconds');
    t.string('createdAt', {
      resolve: (taskDefinition) =>
        taskDefinition.createTime ? new Date(taskDefinition.createTime).toISOString() : new Date().toISOString(),
    });
    t.string('updatedAt', {
      resolve: (taskDefinition) =>
        taskDefinition.updateTime ? new Date(taskDefinition.updateTime).toISOString() : new Date().toISOString(),
    });
    t.string('createdBy', {
      resolve: (taskDefinition) => taskDefinition.createdBy ?? null,
    });
    t.string('updatedBy', {
      resolve: (taskDefinition) => taskDefinition.updatedBy ?? null,
    });
    t.string('description');
    t.int('retryCount');
    t.int('pollTimeoutSeconds');
    t.list.nonNull.string('inputKeys');
    t.list.nonNull.string('outputKeys');
    t.string('inputTemplate', {
      resolve: (taskDefinition) => JSON.stringify(taskDefinition.inputTemplate) ?? null,
    });
    t.field('timeoutPolicy', { type: TaskTimeoutPolicy });
    t.field('retryLogic', { type: RetryLogic });
    t.int('retryDelaySeconds');
    t.int('responseTimeoutSeconds');
    t.int('concurrentExecLimit');
    t.int('rateLimitFrequencyInSeconds');
    t.int('rateLimitPerFrequency');
    t.string('ownerEmail');
  },
});

export const TaskDefinitionEdge = objectType({
  name: 'TaskDefinitionEdge',
  definition: (t) => {
    t.nonNull.field('node', {
      type: TaskDefinition,
    });
    t.nonNull.string('cursor');
  },
});

export const TaskDefinitionConnection = objectType({
  name: 'TaskDefinitionConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', {
      type: TaskDefinitionEdge,
    });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});

export const FilterTaskDefinitionsInput = inputObjectType({
  name: 'FilterTaskDefinitionsInput',
  definition: (t) => {
    t.string('keyword');
  },
});
export const SortTasksBy = enumType({
  name: 'SortTasksBy',
  members: ['name', 'timeoutPolicy', 'timeoutSeconds', 'responseTimeoutSeconds', 'retryCount', 'retryLogic'],
});
export const TasksOrderByInput = inputObjectType({
  name: 'TasksOrderByInput',
  definition: (t) => {
    t.nonNull.field('sortKey', { type: SortTasksBy });
    t.nonNull.field('direction', { type: SortDirection });
  },
});
export const TaskDefinitionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('taskDefinitions', {
      type: TaskDefinitionConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: arg({ type: FilterTaskDefinitionsInput }),
        orderBy: TasksOrderByInput,
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { filter, orderBy: orderingArgs, ...paginationArgs } = args;
        const taskDefinitions = await conductorAPI.getTaskDefinitions(config.conductorApiURL);

        const filteredTaskDefs = filter?.keyword
          ? getFilteredTaskDefinitions(taskDefinitions, filter.keyword)
          : taskDefinitions;
        const orderedTaskDefs = orderingArgs?.sortKey
          ? orderBy(filteredTaskDefs, orderingArgs?.sortKey, orderingArgs?.direction === 'ASC' ? 'asc' : 'desc')
          : filteredTaskDefs;

        const tasksWithId = orderedTaskDefs.map((task) => ({
          ...task,
          id: toGraphId('TaskDefinition', task.name),
        }));
        return {
          ...connectionFromArray(tasksWithId, paginationArgs),
          totalCount: filteredTaskDefs.length,
        };
      },
    });
  },
});

export const PollData = objectType({
  name: 'PollData',
  definition: (t) => {
    t.nonNull.id('id');
    t.string('queueName');
    t.string('workerId');
    t.string('domain');
    t.string('lastPollTime');
  },
});

export const PollDataEdge = objectType({
  name: 'PollDataEdge',
  definition: (t) => {
    t.string('cursor');
    t.field('node', { type: PollData });
  },
});

export const PollDataConnection = objectType({
  name: 'PollDataConnection',
  definition: (t) => {
    t.int('totalCount');
    t.list.field('edges', { type: PollDataEdge });
    t.field('pageInfo', { type: 'PageInfo' });
  },
});

export const FilterPollDataInput = inputObjectType({
  name: 'FilterPollDataInput',
  definition: (t) => {
    t.string('queueName');
    t.string('workerId');
    t.string('domain');
    t.string('afterDate');
    t.string('beforeDate');
  },
});

export const SortPollsBy = enumType({
  name: 'SortPollsBy',
  members: ['queueName', 'workerId', 'lastPollTime'],
});

export const SortPollsDirection = enumType({
  name: 'SortPollsDirection',
  members: ['asc', 'desc'],
});

export const PollsOrderByInput = inputObjectType({
  name: 'PollsOrderByInput',
  definition: (t) => {
    t.nonNull.field('sortKey', { type: SortPollsBy });
    t.nonNull.field('direction', { type: SortPollsDirection });
  },
});

export const PollDataQuery = queryField('pollData', {
  type: PollDataConnection,
  args: {
    filter: arg({ type: FilterPollDataInput }),
    orderBy: nonNull(arg({ type: PollsOrderByInput })),
    ...PaginationConnectionArgs,
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { filter, orderBy: orderingArgs, ...pagination } = args;

    const pollData = await conductorAPI.getPollData(config.conductorApiURL);
    const filteredData = filterPollData(pollData, filter);

    const orderedData = orderBy(filteredData, [orderingArgs.sortKey], [orderingArgs.direction]);

    return connectionFromArray(makeFromApiToGraphQLPollData(orderedData), pagination);
  },
});

export const DeleteTaskDefinitionMutation = mutationField('deleteTask', {
  type: IsOkResponse,
  args: {
    name: nonNull(stringArg()),
  },
  resolve: async (_, { name }, { conductorAPI }) => {
    try {
      await conductorAPI.deleteTaskDefinition(config.conductorApiURL, name);
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

const CreateTaskDefinitionInput = inputObjectType({
  name: 'CreateTaskDefinitionInput',
  definition: (t) => {
    t.string('ownerApp');
    t.string('createdBy');
    t.string('updatedBy');
    t.string('accessPolicy');
    t.nonNull.string('name');
    t.string('description');
    t.int('retryCount');
    t.nonNull.int('timeoutSeconds');
    t.list.nonNull.string('inputKeys');
    t.list.nonNull.string('outputKeys');
    t.field('timeoutPolicy', { type: TaskTimeoutPolicy });
    t.field('retryLogic', { type: RetryLogic });
    t.int('retryDelaySeconds');
    t.int('responseTimeoutSeconds');
    t.int('concurrentExecLimit');
    t.string('inputTemplate');
    t.int('rateLimitPerFrequency');
    t.int('rateLimitFrequencyInSeconds');
    t.string('isolationGroupId');
    t.string('executionNameSpace');
    t.string('ownerEmail');
    t.int('pollTimeoutSeconds');
    t.int('backoffScaleFactor');
  },
});

export const CreateTaskDefinitionMutation = mutationField('createTaskDefinition', {
  type: TaskDefinition,
  args: {
    input: nonNull(arg({ type: CreateTaskDefinitionInput })),
  },
  resolve: async (_, { input }, { conductorAPI }) => {
    if (input.responseTimeoutSeconds == null || input.responseTimeoutSeconds > input.timeoutSeconds) {
      throw new Error(
        'Response timeout cannot be greater than task timeout. Default value for responseTimeoutSeconds is 3600',
      );
    }

    const taskDefinitionInput = getTaskDefinitionInput(input);

    await conductorAPI.createTaskDefinition(config.conductorApiURL, taskDefinitionInput);

    return {
      ...taskDefinitionInput,
      id: toGraphId('TaskDefinition', input.name),
    };
  },
});
