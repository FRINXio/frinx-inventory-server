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

const WorkflowTask = t.type({
  name: t.string,
  taskReferenceName: t.string,
});

const WorkflowMetadata = t.type({
  createTime: optional(t.number),
  updateTime: optional(t.number),
  createdBy: optional(t.string),
  updatedBy: optional(t.string),
  name: t.string,
  description: optional(t.string),
  version: optional(t.number),
  tasks: t.array(WorkflowTask),
  timeoutSeconds: t.number,
  inputParameters: optional(t.array(t.string)),
  outputParameters: optional(t.record(t.string, t.string)),
});

const WorkflowMetadataValidator = t.array(WorkflowMetadata);

export type WorfklowMetadataOutput = t.TypeOf<typeof WorkflowMetadataValidator>;

export function decodeWorkflowMetadataOutput(value: unknown): WorfklowMetadataOutput {
  return extractResult(WorkflowMetadataValidator.decode(value));
}
