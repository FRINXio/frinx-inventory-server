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
    t.int('retryCount');
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
    t.string('taskDefName');
    t.string('workflowType');
    t.boolean('retried');
    t.boolean('executed');
    t.string('taskId');
    t.string('reasonForIncompletion');
    t.string('taskDefinition', { resolve: (task) => JSON.stringify(task.taskDefinition) });
    t.string('subWorkflowId');
  },
});
