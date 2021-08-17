import * as t from 'io-ts';
import { Either, fold } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { HttpStatusCode } from '../errors/base-error';
import APIError from '../errors/api-error';

function optional<T, U>(type: t.Type<T, U>) {
  return t.union([type, t.void]);
}

export function extractResult<A>(result: Either<t.Errors, A>): A {
  return fold(
    () => {
      const errorMessages = PathReporter.report(result);
      throw new APIError('BAD_REQUEST', HttpStatusCode.INTERNAL_SERVER, true, errorMessages.join(''));
    },
    (data: A) => data,
  )(result);
}

const InstalledDevicesOutputValidator = t.type({
  output: t.type({
    nodes: optional(t.array(t.string)),
  }),
});
export type InstalledDevicesOutput = t.TypeOf<typeof InstalledDevicesOutputValidator>;

export function decodeInstalledDevicesOutput(value: unknown): InstalledDevicesOutput {
  return extractResult(InstalledDevicesOutputValidator.decode(value));
}

export type UninstallDeviceInput = {
  input: {
    'node-id': string;
    'connection-type': 'netconf' | 'cli';
  };
};

const UniconfigZonesOutputValidator = t.type({
  instances: t.array(t.string),
});
export type UniconfigZonesOutput = t.TypeOf<typeof UniconfigZonesOutputValidator>;

export function decodeUniconfigZonesOutput(value: unknown): UniconfigZonesOutput {
  return extractResult(UniconfigZonesOutputValidator.decode(value));
}

const UniconfigConfigOutputValidator = t.type({
  'frinx-uniconfig-topology:configuration': t.unknown,
});
export type UniconfigConfigOutput = t.TypeOf<typeof UniconfigConfigOutputValidator>;

export function decodeUniconfigConfigOutput(value: unknown): UniconfigConfigOutput {
  return extractResult(UniconfigConfigOutputValidator.decode(value));
}

const UniconfigConfigInputValidator = t.type({
  'frinx-uniconfig-topology:configuration': t.unknown,
});
export type UniconfigConfigInput = t.TypeOf<typeof UniconfigConfigInputValidator>;

export function decodeUniconfigConfigInput(value: unknown): UniconfigConfigInput {
  return extractResult(UniconfigConfigInputValidator.decode(value));
}

const UniconfigCommitInputValidator = t.type({
  input: t.type({
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigCommitInput = t.TypeOf<typeof UniconfigCommitInputValidator>;

export function decodeUniconfigCommitInput(value: unknown): UniconfigCommitInput {
  return extractResult(UniconfigCommitInputValidator.decode(value));
}

const UniconfigCommitOutputValidator = t.type({
  output: t.type({
    'overall-status': t.union([t.literal('complete'), t.literal('fail')]),
  }),
});
export type UniconfigCommitOutput = t.TypeOf<typeof UniconfigCommitOutputValidator>;

export function decodeUniconfigCommitOutput(value: unknown): UniconfigCommitOutput {
  return extractResult(UniconfigCommitOutputValidator.decode(value));
}

const UniconfigReplaceInputValidator = t.type({
  input: t.type({
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigReplaceInput = t.TypeOf<typeof UniconfigReplaceInputValidator>;

export function decodeUniconfigReplaceInput(value: unknown): UniconfigReplaceInput {
  return extractResult(UniconfigReplaceInputValidator.decode(value));
}

const UniconfigReplaceOutputValidator = t.type({
  output: t.type({
    'overall-status': t.union([t.literal('complete'), t.literal('fail')]),
  }),
});
export type UniconfigReplaceOutput = t.TypeOf<typeof UniconfigReplaceOutputValidator>;

export function decodeUniconfigReplaceOutput(value: unknown): UniconfigReplaceOutput {
  return extractResult(UniconfigReplaceOutputValidator.decode(value));
}

const UniconfigSnapshotsOutputValidator = t.type({
  'snapshots-metadata': t.type({
    snapshot: t.array(
      t.type({
        name: t.string,
      }),
    ),
  }),
});
export type UniconfigSnapshotsOutput = t.TypeOf<typeof UniconfigSnapshotsOutputValidator>;

export function decodeUniconfigSnapshotsOutput(value: unknown): UniconfigSnapshotsOutput {
  return extractResult(UniconfigSnapshotsOutputValidator.decode(value));
}

const UniconfigSnapshotInputValidator = t.type({
  input: t.type({
    name: t.string,
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigSnapshotInput = t.TypeOf<typeof UniconfigSnapshotInputValidator>;

export function decodeUniconfigSnapshotInput(value: unknown): UniconfigSnapshotInput {
  return extractResult(UniconfigSnapshotInputValidator.decode(value));
}
const UniconfigSnapshotOutputValidator = t.type({
  output: t.type({
    'overall-status': t.union([t.literal('complete'), t.literal('fail')]),
  }),
});
export type UniconfigSnapshotOutput = t.TypeOf<typeof UniconfigSnapshotOutputValidator>;

export function decodeUniconfigSnapshotOutput(value: unknown): UniconfigSnapshotOutput {
  return extractResult(UniconfigSnapshotOutputValidator.decode(value));
}

const UniconfigApplySnapshotInputValidator = t.type({
  input: t.type({
    name: t.string,
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigApplySnapshotInput = t.TypeOf<typeof UniconfigApplySnapshotInputValidator>;

export function decodeUniconfigApplySnapshotInput(value: unknown): UniconfigApplySnapshotInput {
  return extractResult(UniconfigApplySnapshotInputValidator.decode(value));
}

const UniconfigApplySnapshotOutputValidator = t.type({
  output: t.type({
    'overall-status': t.union([t.literal('complete'), t.literal('fail')]),
  }),
});
export type UniconfigApplySnapshotOutput = t.TypeOf<typeof UniconfigApplySnapshotOutputValidator>;

export function decodeUniconfigApplySnapshotOutput(value: unknown): UniconfigApplySnapshotOutput {
  return extractResult(UniconfigApplySnapshotOutputValidator.decode(value));
}
