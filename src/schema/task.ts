import { enumType, inputObjectType, objectType } from 'nexus';
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

export const WorkflowTaskType = enumType({
  name: 'WorkflowTaskType',
  members: [
    'SIMPLE',
    'DECISION',
    'DYNAMIC',
    'FORK_JOIN',
    'JOIN',
    'SUB_WORKFLOW',
    'FORK_JOIN_DYNAMIC',
    'EVENT',
    'LAMBDA',
    'HTTP',
    'KAFKA_PUBLISH',
    'TERMINATE',
    'HUMAN',
    'WAIT',
    'JSON_JQ_TRANSFORM',
    'SET_VARIABLE',
    'DO_WHILE',
    'START_WORKFLOW',
    'USER_DEFINED',
    'INLINE',
    'EXCLUSIVE_JOIN',
    'SWITCH',
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
    t.string('inputData', { resolve: (task) => JSON.stringify(task.inputData) });
    t.string('outputData', { resolve: (task) => JSON.stringify(task.outputData) });
    t.string('externalOutputPayloadStoragePath');
    t.string('externalInputPayloadStoragePath');
    t.int('callbackAfterSeconds');
    t.int('seq');
    t.int('pollCount');
  },
});

export const TaskInput = inputObjectType({
  name: 'TaskInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('taskReferenceName');
    t.string('description');
    t.string('inputParameters');
    t.string('type');
    t.int('startDelay');
    t.boolean('optional');
    t.boolean('asyncComplete');
    t.list.field('workflowTaskType', { type: WorkflowTaskType });
    t.list.string('joinOn');
    t.string('decisionCases');
    t.string('defaultCase');
    t.string('loopCondition');
    t.int('retryCount');
  },
});
