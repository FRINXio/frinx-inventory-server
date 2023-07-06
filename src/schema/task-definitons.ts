import { arg, enumType, extendType, inputObjectType, list, mutationField, nonNull, objectType } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { TaskDefinitionDetailInput } from '../external-api/conductor-network-types';

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

export const CreateTaskDefinitionPayload = objectType({
  name: 'CreateTaskDefinitionPayload',
  definition: (t) => {
    t.nonNull.field('taskDefinition', { type: TaskDefinition });
  },
});

const TaskDefinitionInput = inputObjectType({
  name: 'TaskDefinitionInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.string('description');
    t.int('retryCount');
    t.nonNull.int('timeoutSeconds');
    t.int('pollTimeoutSeconds');
    t.list.nonNull.string('inputKeys');
    t.list.nonNull.string('outputKeys');
    t.record('inputTemplate');
    t.field('timeoutPolicy', { type: TaskTimeoutPolicy });
    t.field('retryLogic', { type: RetryLogic });
    t.int('retryDelaySeconds');
    t.int('responseTimeoutSeconds');
    t.int('concurrentExecLimit');
    t.int('rateLimitFrequencyInSeconds');
    t.int('rateLimitPerFrequency');
    t.string('ownerEmail');
    t.string('createTime');
    t.string('updateTime');
  },
});

export const CreateTaskDefinitionInput = inputObjectType({
  name: 'CreateTaskDefinitionInput',
  definition: (t) => {
    t.nonNull.field('taskDefinition', {
      type: TaskDefinitionInput,
    });
  },
});

export const CreateTaskDefinitionMutation = mutationField('createTaskDefinition', {
  type: CreateTaskDefinitionPayload,
  args: {
    input: nonNull(arg({ type: CreateTaskDefinitionInput })),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { input } = args;
    const { taskDefinition } = input;
    const timeoutPolicy = taskDefinition.timeoutPolicy !== null ? taskDefinition.timeoutPolicy : 'RETRY';
    const retryLogic = taskDefinition.retryLogic !== null ? taskDefinition.retryLogic : 'FIXED';

    const task: TaskDefinitionDetailInput = {
      ...taskDefinition,
      pollTimeoutSeconds: taskDefinition.pollTimeoutSeconds || 0,
      inputKeys: taskDefinition.inputKeys || [],
      outputKeys: taskDefinition.outputKeys || [],
      inputTemplate: taskDefinition.inputTemplate || '',
      retryDelaySeconds: taskDefinition.retryDelaySeconds || 0,
      responseTimeoutSeconds: taskDefinition.responseTimeoutSeconds || 0,
      concurrentExecLimit: taskDefinition.concurrentExecLimit || 0,
      rateLimitFrequencyInSeconds: taskDefinition.rateLimitFrequencyInSeconds || 0,
      rateLimitPerFrequency: taskDefinition.rateLimitPerFrequency || 0,
      ownerEmail: taskDefinition.ownerEmail || '',
      timeoutPolicy,
      retryLogic,
      retryCount: taskDefinition.retryCount || 0,
    };

    await conductorAPI.createTaskDefinition(config.conductorApiURL, task);
    return {
      taskDefinition: {
        id: toGraphId('TaskDefinition', task.name),
        ...task,
      },
    };
  },
});
