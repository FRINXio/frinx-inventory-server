import { arg, enumType, extendType, inputObjectType, list, mutationField, nonNull, objectType, stringArg } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { getTaskDefinitionInput } from '../helpers/task-definition.helpers';
import { IsOkResponse, Node, PageInfo, PaginationConnectionArgs } from './global-types';
import { getFilteredTaskDefinitions } from '../helpers/task-definition.helpers';
import {connectionFromArray} from '../helpers/connection.helpers'
import { log } from 'console';

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
    t.string('createTime', {
      resolve: (taskDefinition) =>
        taskDefinition.createTime ? new Date(taskDefinition.createTime).toISOString() : new Date().toISOString(),
    });
    t.string('updateTime', {
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



export const TaskDefinitionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('taskDefinitions', {
      type: TaskDefinitionConnection,
      args: {
        ...PaginationConnectionArgs,
        filter: arg({ type: FilterTaskDefinitionsInput }),
      },
      resolve: async (_, args, { conductorAPI }) => {
        const { filter, ...paginationArgs } = args;
        const taskDefinitions = await conductorAPI.getTaskDefinitions(config.conductorApiURL);
        const filteredTaskDefs = filter?.keyword
          ? getFilteredTaskDefinitions(taskDefinitions, filter.keyword)
          : taskDefinitions;

          const tasksWithId = filteredTaskDefs.map((task) => ({
            ...task,
            id: task.name,
          }));
        return {
          ...connectionFromArray(tasksWithId, paginationArgs),
          totalCount: filteredTaskDefs.length,
        };
      },
    });
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
