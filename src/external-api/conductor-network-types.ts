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

export type WorfklowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;
export type ApiWorkflow = t.TypeOf<typeof WorkflowMetadata>;

export function decodeWorkflowMetadataOutput(value: unknown): WorfklowMetadataOutput {
  return extractResult(WorkflowMetadataValidator.decode(value));
}

export type WorkflowDetailOutput = t.TypeOf<typeof WorkflowMetadata>;
export type WorkflowDetailInput = t.TypeOf<typeof WorkflowMetadata>;

export function decodeWorkflowDetailOutput(value: unknown): WorkflowDetailOutput {
  return extractResult(WorkflowMetadata.decode(value));
}
