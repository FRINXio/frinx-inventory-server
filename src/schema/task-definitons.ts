import { arg, enumType, extendType, inputObjectType, list, mutationField, nonNull, objectType } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { TaskDefinitionDetailInput } from '../external-api/conductor-network-types';
import { makeNullablePropertiesToUndefined } from '../helpers/utils.helpers';

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
    t.implements('Node');
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

const DeleteTaskDefinitionPayload = objectType({
  name: 'DeleteTaskDefinitionPayload',
  definition: (t) => {
    t.nonNull.field('taskDefinition', {
      type: TaskDefinition,
    });
  },
});

const DeleteTaskDefinitionInput = inputObjectType({
  name: 'DeleteTaskDefinitionInput',
  definition: (t) => {
    t.nonNull.string('name');
  },
});

export const DeleteTaskDefinitionMutation = mutationField('deleteTaskDefinition', {
  type: DeleteTaskDefinitionPayload,
  args: {
    input: nonNull(arg({ type: DeleteTaskDefinitionInput })),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { input } = args;
    const taskDefinitionToDelete = await conductorAPI.getTaskDetail(config.conductorApiURL, input.name);
    await conductorAPI.deleteTaskDefinition(config.conductorApiURL, input.name);
    return {
      taskDefinition: {
        id: toGraphId('TaskDefinition', taskDefinitionToDelete.name),
        ...taskDefinitionToDelete,
      },
    };
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
    const taskDefinitionInput: TaskDefinitionDetailInput = {
      ...makeNullablePropertiesToUndefined(input),
      name: input.name,
      timeoutSeconds: input.timeoutSeconds,
      inputTemplate: input.inputTemplate != null ? JSON.parse(input.inputTemplate) : undefined,
      accessPolicy: input.accessPolicy != null ? JSON.parse(input.accessPolicy) : undefined,
      createTime: Date.now(),
      updateTime: Date.now(),
    };

    await conductorAPI.createTaskDefinition(config.conductorApiURL, taskDefinitionInput);
    const taskDefinition = await conductorAPI.getTaskDetail(config.conductorApiURL, input.name);

    return {
      ...taskDefinition,
      id: toGraphId('TaskDefinition', input.name),
    };
  },
});
