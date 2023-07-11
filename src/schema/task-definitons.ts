import { arg, enumType, extendType, inputObjectType, list, nonNull, objectType, queryField } from 'nexus';
import { connectionFromArray } from 'graphql-relay';
import { v4 as uuid } from 'uuid';
import config from '../config';
import { PaginationConnectionArgs } from './global-types';
import { filterPollData, makeFromApiToGraphQLPollData } from '../helpers/task.helpers';
import { toGraphId } from '../helpers/id-helper';

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
    t.string('createdBy');
    t.string('updatedBy');
    t.string('description');
    t.int('retryCount');
    t.int('pollTimeoutSeconds');
    t.list.nonNull.string('inputKeys');
    t.list.nonNull.string('outputKeys');
    t.string('inputTemplate', {
      resolve: (taskDefinition) => JSON.stringify(taskDefinition.inputTemplate),
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

export const TaskDefinitionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('taskDefinitions', {
      type: list(nonNull(TaskDefinition)),
      resolve: async (_, _args, { conductorAPI }) => {
        const taskDefinitions = await conductorAPI.getTaskDefinitions(config.conductorApiURL);

        return taskDefinitions;
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
    t.int('beforeLastPollTime');
    t.int('afterLastPollTime');
  },
});

export const PollDataQuery = queryField('pollData', {
  type: PollDataConnection,
  args: {
    filter: arg({ type: FilterPollDataInput }),
    ...PaginationConnectionArgs,
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { filter, ...pagination } = args;
    const pollData = await conductorAPI.getPollData(config.conductorApiURL);
    const filteredPollData = filterPollData(
      pollData.map((polldata) => ({
        ...polldata,
      })),
      { ...filter },
    );
    const filteredPollDataWithId = makeFromApiToGraphQLPollData(filteredPollData).map((polldata) => ({
      ...polldata,
      id: toGraphId('PollData', uuid()),
    }));
    const paginatedPollData = connectionFromArray(filteredPollDataWithId, pagination);
    return paginatedPollData;
  },
});
