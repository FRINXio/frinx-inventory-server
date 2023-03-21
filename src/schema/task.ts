import { enumType, objectType } from 'nexus';
import { v4 as uuid } from 'uuid';
import { toGraphId } from '../helpers/id-helper';

export const ExecutedWorkflowTaskStatus = enumType({
  name: 'ExecutedWorkflowTaskStatus',
  members: [
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'TIMED_OUT',
    'CANCELED',
    'SCHEDULED',
    'SKIPPED',
    'FAILED_WITH_TERMINAL_ERROR',
    'COMPLETED_WITH_ERROR',
  ],
});

export const ExecutedWorkflowTask = objectType({
  name: 'ExecutedWorkflowTask',
  definition: (t) => {
    t.implements('Node');
    t.nonNull.id('id', {
      resolve: (executedWorkflowTask) => toGraphId('ExecutedWorkflowTask', executedWorkflowTask.taskId ?? uuid()),
    });
    t.string('taskType');
    t.string('taskReferenceName');
    t.field('status', { type: ExecutedWorkflowTaskStatus });
    // t.string('inputData', { resolve: (task) => task.inputData });
    // t.string('outputData', { resolve: (task) => task.outputData });
    t.int('retryCount');
    t.string('seq');
    t.int('pollCount');
    t.string('startTime', {
      resolve: (task) => (task.startTime ? new Date(task.startTime).toISOString() : null),
    });
    t.string('endTime', {
      resolve: (task) => (task.endTime ? new Date(task.endTime).toISOString() : null),
    });
    t.string('updateTime', {
      resolve: (task) => (task.updateTime ? new Date(task.updateTime).toISOString() : null),
    });
    t.string('scheduledTime', {
      resolve: (task) => (task.scheduledTime ? new Date(task.scheduledTime).toISOString() : null),
    });
    t.string('correlationId');
    t.string('taskDefName');
    t.int('callbackAfterSeconds');
    t.int('startDelayInSeconds');
    t.string('workflowInstanceId');
    t.string('workflowType');
    t.boolean('retried');
    t.int('responseTimeoutSeconds');
    t.string('executionNameSpace');
    t.boolean('executed');
    t.boolean('callbackFromWorker');
    t.string('workerId');
    t.string('taskId');
    t.string('reasonForIncompletion');
    t.string('domain');
    t.int('rateLimitPerFrequency');
    t.int('rateLimitFrequencyInSeconds');
    t.int('workflowPriority');
    t.string('isolationGroupId');
    t.string('taskDefinition', { resolve: (task) => JSON.stringify(task.taskDefinition) });
    t.int('iteration');
    t.string('subWorkflowId');
    t.boolean('subWorkflowChanged');
    t.int('queueWaitTime');
    t.boolean('loopOverTask');
    t.string('externalInputPayloadStoragePath');
    t.string('externalOutputPayloadStoragePath');
  },
});
