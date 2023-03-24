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
  // description: optional(t.string),
  // inputParameters: optional(t.record(t.string, t.any)),
  // type: optional(t.string),
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
  workflowId: optional(t.string),
  parentWorkflowId: optional(t.string),
  parentWorkflowTaskId: optional(t.string),
  tasks: t.array(optional(ExecutedWorkflowTask)),
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

export type ExecutedWorkflowsOutput = t.TypeOf<typeof ExecutedWorkflowsValidator>;
export type WorfklowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;
export type WorkflowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;
export type ApiWorkflow = t.TypeOf<typeof WorkflowMetadata>;
export type ApiExecutedWorkflow = t.TypeOf<typeof ExecutedWorkflow>;
export type ApiExecutedWorkflowTask = t.TypeOf<typeof ExecutedWorkflowTask>;

export function decodeWorkflowMetadataOutput(value: unknown): WorkflowMetadataOutput {
  return extractResult(WorkflowMetadataValidator.decode(value));
}

export type WorkflowDetailOutput = t.TypeOf<typeof WorkflowMetadata>;
export type WorkflowDetailInput = t.TypeOf<typeof WorkflowMetadata>;

export function decodeWorkflowDetailOutput(value: unknown): WorkflowDetailOutput {
  return extractResult(WorkflowMetadata.decode(value));
}

const WorkflowEditValidator = t.type({
  bulkErrorResults: t.record(t.string, t.string),
  bulkSuccessfulResults: t.array(t.string),
});

export type WorkflowEditOutput = t.TypeOf<typeof WorkflowEditValidator>;

export function decodeWorkflowEditOutput(value: unknown): WorkflowEditOutput {
  return extractResult(WorkflowEditValidator.decode(value));
}
export function decodeExecutedWorkflowsOutput(value: unknown): ExecutedWorkflowsOutput {
  return extractResult(ExecutedWorkflowsValidator.decode(value));
}

export function decodeExecutedWorkflowDetailOutput(value: unknown): ApiExecutedWorkflow {
  return extractResult(ExecutedWorkflow.decode(value));
}
