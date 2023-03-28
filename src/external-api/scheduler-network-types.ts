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

const ScheduleOutputValidator = t.type({
  name: t.string,
  workflowName: t.string,
  workflowVersion: t.string,
  cronString: t.string,
  lastUpdate: t.string,
  correlationId: t.string,
  enabled: optional(t.boolean),
  parallelRuns: optional(t.boolean),
  fromDate: optional(t.string),
  toDate: optional(t.string),
  taskToDomain: optional(t.record(t.string, t.string)),
  workflowContext: optional(t.record(t.string, t.string)),
});

export type ScheduleOutput = t.TypeOf<typeof ScheduleOutputValidator>;

export function decodeScheduleOutput(value: unknown): ScheduleOutput {
  return extractResult(ScheduleOutputValidator.decode(value));
}

const ScheduleListOutputValidator = t.array(ScheduleOutputValidator);

export type ScheduleListOutput = t.TypeOf<typeof ScheduleListOutputValidator>;

export function decodeScheduleListOutput(value: unknown): ScheduleListOutput {
  return extractResult(ScheduleListOutputValidator.decode(value));
}
