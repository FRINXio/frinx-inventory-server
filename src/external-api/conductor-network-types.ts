/* eslint-disable @typescript-eslint/naming-convention */
import { Either, fold } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

export function optional<T, U>(type: t.Type<T, U>) {
  return t.union([type, t.void]);
}

export function extractResult<A>(result: Either<t.Errors, A>): A {
  return fold(
    () => {
      const errorMessages = PathReporter.report(result);
      throw new Error(`BAD_REQUEST: ${errorMessages.join(',')}`);
    },
    (data: A) => data,
  )(result);
}

export const ApiBaseTask = t.type({
  name: t.string,
  taskReferenceName: t.string,
  description: optional(t.string),
  inputParameters: optional(t.record(t.string, t.any)),
  type: optional(t.string),
  // dynamicTaskNameParam: optional(t.string),
  // scriptExpression: optional(t.string),
  // dynamicForkTasksParam: optional(t.string),
  // dynamicForkTasksInputParamName: optional(t.string),
  // forkTasks: optional(t.UnknownArray),
});

export type BaseTask = t.TypeOf<typeof ApiBaseTask>;

export type NestedTask = BaseTask &
  Partial<{
    decisionCases: Record<string, NestedTask[]> | void;
    defaultCase: NestedTask[] | void;
  }>;

// TODO: this is properly typed nested workflow but is not used in graphql schema as
// we are not able to get whole  deeply nested object in graphql
export const WorkflowTask: t.Type<NestedTask> = t.recursion('NestedTask', () =>
  t.intersection([
    ApiBaseTask,
    t.partial({
      decisionCases: optional(t.record(t.string, t.array(WorkflowTask))),
      defaultCase: optional(t.array(WorkflowTask)),
    }),
  ]),
);

// const WorkflowTask = ApiBaseTask;
const WorkflowTasksValidator = t.array(WorkflowTask);

type WorkflowTaskInput = t.TypeOf<typeof WorkflowTasksValidator>;

export function decodeWorkflowTaskInput(value: unknown): WorkflowTaskInput {
  return extractResult(WorkflowTasksValidator.decode(value));
}

const WorkflowMetadataRequired = t.type({
  name: t.string,
  timeoutSeconds: t.number,
  tasks: t.UnknownArray, // TODO: we are passing task as stringified json for now (can we switch to WorkflowTask somehow?)
});

const WorkflowMetadataOptional = t.partial({
  createTime: optional(t.number),
  updateTime: optional(t.number),
  createdBy: optional(t.string),
  updatedBy: optional(t.string),
  description: optional(t.string),
  version: optional(t.number),
  inputParameters: optional(t.array(t.string)),
  outputParameters: optional(t.record(t.string, t.string)),
  failureWorkflow: optional(t.string),
  schemaVersion: optional(t.number),
  restartable: optional(t.boolean),
  workflowStatusListenerEnabled: optional(t.boolean),
  ownerEmail: optional(t.string),
  timeoutPolicy: optional(t.union([t.literal('TIME_OUT_WF'), t.literal('ALERT_ONLY')])),
  variables: optional(t.record(t.string, t.UnknownRecord)),
  inputTemplate: optional(t.record(t.string, t.UnknownRecord)),
});

const WorkflowMetadata = t.intersection([WorkflowMetadataRequired, WorkflowMetadataOptional]);

const WorkflowMetadataValidator = t.array(WorkflowMetadata);

const BulkOperation = t.type({
  bulkErrorResults: t.record(t.string, t.string),
  bulkSuccessfulResults: t.array(t.string),
});

const ExecutedWorkflowTaskStatus = t.union([
  t.literal('IN_PROGRESS'),
  t.literal('COMPLETED'),
  t.literal('FAILED'),
  t.literal('TIMED_OUT'),
  t.literal('SCHEDULED'),
  t.literal('CANCELED'),
  t.literal('SKIPPED'),
  t.literal('FAILED_WITH_TERMINAL_ERROR'),
  t.literal('COMPLETED_WITH_ERROR'),
]);

const ExecutedWorkflowStatus = t.union([
  t.literal('RUNNING'),
  t.literal('COMPLETED'),
  t.literal('FAILED'),
  t.literal('TERMINATED'),
  t.literal('TIMED_OUT'),
  t.literal('PAUSED'),
]);

const ExecutedWorkflowTask = t.type({
  taskType: optional(t.string),
  status: optional(ExecutedWorkflowTaskStatus),
  inputData: optional(t.record(t.string, t.unknown)),
  outputData: optional(t.record(t.string, t.unknown)),
  referenceTaskName: optional(t.string),
  retryCount: optional(t.number),
  seq: optional(t.number),
  pollCount: optional(t.number),
  startTime: optional(t.number),
  endTime: optional(t.number),
  updateTime: optional(t.number),
  correlationId: optional(t.string),
  taskDefName: optional(t.string),
  scheduledTime: optional(t.number),
  callbackAfterSeconds: optional(t.number),
  startDelayInSeconds: optional(t.number),
  retried: optional(t.boolean),
  responseTimeoutSeconds: optional(t.number),
  executionNameSpace: optional(t.string),
  workflowInstanceId: optional(t.string),
  workflowType: optional(t.string),
  executed: optional(t.boolean),
  callbackFromWorker: optional(t.boolean),
  workerId: optional(t.string),
  taskId: optional(t.string),
  reasonForIncompletion: optional(t.string),
  domain: optional(t.string),
  rateLimitPerFrequency: optional(t.number),
  rateLimitFrequencyInSeconds: optional(t.number),
  externalInputPayloadStoragePath: optional(t.string),
  externalOutputPayloadStoragePath: optional(t.string),
  workflowPriority: optional(t.number),
  isolationGroupId: optional(t.string),
  taskDefinition: t.union([optional(t.UnknownRecord), t.null]),
  iteration: optional(t.number),
  subWorkflowId: optional(t.string),
  subWorkflowChanged: optional(t.boolean),
  queueWaitTime: optional(t.number),
  loopOverTask: optional(t.boolean),
});

const ExecutedWorkflow = t.type({
  ownerApp: optional(t.string),
  createTime: optional(t.number),
  updateTime: optional(t.number),
  createdBy: optional(t.string),
  updatedBy: optional(t.string),
  status: ExecutedWorkflowStatus,
  endTime: optional(t.number),
  workflowId: t.string,
  parentWorkflowId: optional(t.string),
  parentWorkflowTaskId: optional(t.string),
  tasks: optional(t.array(ExecutedWorkflowTask)),
  input: optional(t.UnknownRecord),
  output: optional(t.UnknownRecord),
  correlationId: optional(t.string),
  reRunFromWorkflowId: optional(t.string),
  reasonForIncompletion: optional(t.string),
  event: optional(t.string),
  taskToDomain: optional(t.record(t.string, t.string)),
  failedReferenceTaskNames: optional(t.array(t.string)),
  workflowDefinition: optional(WorkflowMetadata),
  externalInputPayloadStoragePath: optional(t.string),
  externalOutputPayloadStoragePath: optional(t.string),
  priority: optional(t.number),
  variables: optional(t.record(t.string, t.UnknownRecord)),
  lastRetriedTime: optional(t.number),
  failedTaskNames: optional(t.array(t.string)),
  startTime: optional(t.number),
  workflowVersion: optional(t.number),
  workflowName: optional(t.string),
});

const ExecutedWorkflowsValidator = t.type({
  results: t.array(ExecutedWorkflow),
});

const CreateTaskDefinitionInputRequired = t.type({
  name: t.string,
  timeoutSeconds: t.number,
});

const CreateTaskDefinitionInputOptional = t.partial({
  ownerApp: optional(t.string),
  createTime: optional(t.number),
  updateTime: optional(t.number),
  createdBy: optional(t.string),
  updatedBy: optional(t.string),
  accessPolicy: optional(t.UnknownRecord),
  description: optional(t.string),
  retryCount: optional(t.number),
  inputKeys: optional(t.array(t.string)),
  outputKeys: optional(t.array(t.string)),
  timeoutPolicy: optional(t.union([t.literal('RETRY'), t.literal('TIME_OUT_WF'), t.literal('ALERT_ONLY')])),
  retryLogic: optional(t.union([t.literal('FIXED'), t.literal('EXPONENTIAL_BACKOFF'), t.literal('LINEAR_BACKOFF')])),
  retryDelaySeconds: optional(t.number),
  responseTimeoutSeconds: optional(t.number),
  concurrentExecLimit: optional(t.number),
  inputTemplate: optional(t.UnknownRecord),
  rateLimitPerFrequency: optional(t.number),
  rateLimitFrequencyInSeconds: optional(t.number),
  isolationGroupId: optional(t.string),
  executionNameSpace: optional(t.string),
  ownerEmail: optional(t.string),
  pollTimeoutSeconds: optional(t.number),
  backoffScaleFactor: optional(t.number),
});

const TaskDefinitionInput = t.intersection([CreateTaskDefinitionInputRequired, CreateTaskDefinitionInputOptional]);

const TaskDefinition = t.type({
  name: t.string,
  timeoutSeconds: t.number,
  createTime: optional(t.number),
  updateTime: optional(t.number),
  createdBy: optional(t.string),
  updatedBy: optional(t.string),
  retryCount: optional(t.number),
  pollTimeoutSeconds: optional(t.number),
  inputKeys: optional(t.array(t.string)),
  outputKeys: optional(t.array(t.string)),
  inputTemplate: optional(t.record(t.string, t.string)),
  timeoutPolicy: optional(t.union([t.literal('RETRY'), t.literal('TIME_OUT_WF'), t.literal('ALERT_ONLY')])),
  retryLogic: optional(t.union([t.literal('FIXED'), t.literal('EXPONENTIAL_BACKOFF'), t.literal('LINEAR_BACKOFF')])),
  retryDelaySeconds: optional(t.number),
  responseTimeoutSeconds: optional(t.number),
  concurrentExecLimit: optional(t.number),
  rateLimitFrequencyInSeconds: optional(t.number),
  rateLimitPerFrequency: optional(t.number),
  ownerEmail: optional(t.string),
});
const TaskDefinitionsValidator = t.array(TaskDefinition);

const PollData = t.type({
  queueName: optional(t.string),
  domain: optional(t.string),
  workerId: optional(t.string),
  lastPollTime: optional(t.number),
});
const PollDataArray = t.array(PollData);

const ActionStartWorkflow = t.type({
  name: optional(t.string),
  version: optional(t.number),
  input: optional(t.UnknownRecord),
  correlationId: optional(t.string),
  taskToDomain: optional(t.record(t.string, t.string)),
});

const ActionCompleteTask = t.type({
  workflowId: optional(t.string),
  taskId: optional(t.string),
  output: optional(t.UnknownRecord),
  taskRefName: optional(t.string),
});

const ActionFailTask = t.type({
  workflowId: optional(t.string),
  taskId: optional(t.string),
  output: optional(t.UnknownRecord),
  taskRefName: optional(t.string),
});

const EventHandlerAction = t.type({
  action: optional(t.union([t.literal('start_workflow'), t.literal('complete_task'), t.literal('fail_task')])),
  start_workflow: optional(ActionStartWorkflow),
  complete_task: optional(ActionCompleteTask),
  fail_task: optional(ActionFailTask),
  expandInlineJSON: optional(t.boolean),
});
export type ApiEventHandlerAction = t.TypeOf<typeof EventHandlerAction>;

const EventHandler = t.type({
  name: t.string,
  event: t.string,
  condition: optional(t.string),
  actions: t.array(EventHandlerAction),
  active: optional(t.boolean),
  evaluatorType: optional(t.string),
});
const EventHandlersValidator = t.array(EventHandler);

export type ExecutedWorkflowsOutput = t.TypeOf<typeof ExecutedWorkflowsValidator>;
export type WorfklowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;
export type WorkflowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;
export type ApiWorkflow = t.TypeOf<typeof WorkflowMetadata>;
export type ApiExecutedWorkflow = t.TypeOf<typeof ExecutedWorkflow>;
export type ApiExecutedWorkflowTask = t.TypeOf<typeof ExecutedWorkflowTask>;
export type ApiTaskDefinition = t.TypeOf<typeof TaskDefinition>;
export type ApiPollData = t.TypeOf<typeof PollData>;
export type ApiPollDataArray = t.TypeOf<typeof PollDataArray>;
export type ApiEventHandlersOutput = t.TypeOf<typeof EventHandlersValidator>;
export type ApiEventHandler = t.TypeOf<typeof EventHandler>;

export function decodeWorkflowMetadataOutput(value: unknown): WorkflowMetadataOutput {
  return extractResult(WorkflowMetadataValidator.decode(value));
}

export type WorkflowDetailOutput = t.TypeOf<typeof WorkflowMetadata>;
export type WorkflowDetailInput = t.TypeOf<typeof WorkflowMetadata>;

export function decodeWorkflowDetailOutput(value: unknown): WorkflowDetailOutput {
  return extractResult(WorkflowMetadata.decode(value));
}

export type BulkOperationOutput = t.TypeOf<typeof BulkOperation>;

export function decodeBulkOperationOutput(value: unknown): BulkOperationOutput {
  return extractResult(BulkOperation.decode(value));
}

export function decodeExecutedWorkflowsOutput(value: unknown): ExecutedWorkflowsOutput {
  return extractResult(ExecutedWorkflowsValidator.decode(value));
}

export function decodeExecutedWorkflowDetailOutput(value: unknown): ApiExecutedWorkflow {
  return extractResult(ExecutedWorkflow.decode(value));
}

export type TaskDefinitionsOutput = t.TypeOf<typeof TaskDefinitionsValidator>;
export type TaskDefinitionOutput = t.TypeOf<typeof TaskDefinition>;

export type TaskDefinitionDetailInput = t.TypeOf<typeof TaskDefinitionInput>;

export function decodeTaskDefinitionsOutput(value: unknown): TaskDefinitionsOutput {
  return extractResult(TaskDefinitionsValidator.decode(value));
}

export function decodeTaskDefinitionOutput(value: unknown): TaskDefinitionOutput {
  return extractResult(TaskDefinition.decode(value));
}

export function decodeBulkTerminateOutput(value: unknown): BulkOperationOutput {
  return extractResult(BulkOperation.decode(value));
}

export function decodeBulkRetryOutput(value: unknown): BulkOperationOutput {
  return extractResult(BulkOperation.decode(value));
}

export function decodeBulkRestartOutput(value: unknown): BulkOperationOutput {
  return extractResult(BulkOperation.decode(value));
}

export function decodeExecutedWorkflowTaskDetailOutput(value: unknown): ApiExecutedWorkflowTask {
  return extractResult(ExecutedWorkflowTask.decode(value));
}

export function decodePollDataOutput(value: unknown): ApiPollDataArray {
  return extractResult(PollDataArray.decode(value));
}

export function decodeEventHandlersOutput(value: unknown): ApiEventHandlersOutput {
  return extractResult(EventHandlersValidator.decode(value));
}
