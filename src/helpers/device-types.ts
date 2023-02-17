import { Either, fold } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

function optional<T, U>(type: t.Type<T, U>) {
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

const MetadataValidator = t.type({
  deviceSize: optional(t.union([t.literal('SMALL'), t.literal('MEDIUM'), t.literal('LARGE')])),
});

export type MetadataOutput = t.TypeOf<typeof MetadataValidator>;

export function decodeMetadataOutput(value: unknown): MetadataOutput | null {
  if (value == null) {
    return null;
  }
  return extractResult(MetadataValidator.decode(value));
}
