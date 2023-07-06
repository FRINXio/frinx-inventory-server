import { arg, enumType, extendType, inputObjectType, list, mutationField, nonNull, objectType } from 'nexus';
import config from '../config';
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
      resolve: (taskDefinition) => (taskDefinition.inputTemplate ? JSON.stringify(taskDefinition.inputTemplate) : null),
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
    const taskDefinitionInput = {
      ...input,
      createdBy: input.createdBy ?? undefined,
      updatedBy: input.updatedBy ?? undefined,
      retryCount: input.retryCount ?? undefined,
      pollTimeoutSeconds: input.pollTimeoutSeconds ?? undefined,
      inputKeys: input.inputKeys ?? undefined,
      outputKeys: input.outputKeys ?? undefined,
      inputTemplate: input.inputTemplate ? JSON.parse(input.inputTemplate) : undefined,
      timeoutPolicy: input.timeoutPolicy ?? undefined,
      retryLogic: input.retryLogic ?? undefined,
      retryDelaySeconds: input.retryDelaySeconds ?? undefined,
      responseTimeoutSeconds: input.responseTimeoutSeconds ?? undefined,
      concurrentExecLimit: input.concurrentExecLimit ?? undefined,
      rateLimitFrequencyInSeconds: input.rateLimitFrequencyInSeconds ?? undefined,
      rateLimitPerFrequency: input.rateLimitPerFrequency ?? undefined,
      ownerEmail: input.ownerEmail ?? undefined,
      accessPolicy: input.accessPolicy ? JSON.parse(input.accessPolicy) : undefined,
      ownerApp: input.ownerApp ?? undefined,
      description: input.description ?? undefined,
      isolationGroupId: input.isolationGroupId ?? undefined,
      executionNameSpace: input.executionNameSpace ?? undefined,
      backoffScaleFactor: input.backoffScaleFactor ?? undefined,
      createTime: Date.now(),
      updateTime: Date.now(),
    };

    await conductorAPI.createTaskDefinition(config.conductorApiURL, taskDefinitionInput);

    return {
      ...taskDefinitionInput,
      id: toGraphId('TaskDefinition', input.name),
    };
  },
});
