/* eslint-disable @typescript-eslint/naming-convention */
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

const UniconfigStatusValidator = t.union([t.literal('complete'), t.literal('fail')]);
const UniconfigCommitOutputValidator = t.type({
  output: t.union([
    t.type({}),
    t.type({
      'overall-status': t.literal('complete'),
      'node-results': t.type({
        'node-result': t.array(
          t.type({
            'node-id': t.string,
            'configuration-status': t.literal('complete'),
          }),
        ),
      }),
    }),
    t.type({
      'overall-status': t.literal('fail'),
      'node-results': t.type({
        'node-result': t.array(
          t.type({
            'node-id': t.string,
            'error-type': optional(t.string),
            'error-message': optional(t.string),
            'configuration-status': t.literal('fail'),
            'rollback-status': optional(UniconfigStatusValidator),
          }),
        ),
      }),
    }),
  ]),
});
export type UniconfigCommitOutput = t.TypeOf<typeof UniconfigCommitOutputValidator>;

export function decodeUniconfigCommitOutput(value: unknown): UniconfigCommitOutput {
  return extractResult(UniconfigCommitOutputValidator.decode(value));
}

const UniconfigDryRunCommitOutputValidator = t.type({
  output: t.union([
    t.type({}),
    t.type({
      'overall-status': t.literal('complete'),
      'node-results': t.type({
        'node-result': t.array(
          t.type({
            'node-id': t.string,
            configuration: t.string,
            'configuration-status': t.literal('complete'),
          }),
        ),
      }),
    }),
    t.type({
      'overall-status': t.literal('fail'),
      'node-results': t.type({
        'node-result': t.array(
          t.type({
            'node-id': t.string,
            'error-type': optional(t.string),
            'error-message': optional(t.string),
            'configuration-status': t.literal('fail'),
          }),
        ),
      }),
    }),
  ]),
});
export type UniconfigDryRunCommitOutput = t.TypeOf<typeof UniconfigDryRunCommitOutputValidator>;

export function decodeUniconfigDryRunCommitOutput(value: unknown): UniconfigDryRunCommitOutput {
  return extractResult(UniconfigDryRunCommitOutputValidator.decode(value));
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
    'overall-status': UniconfigStatusValidator,
  }),
});
export type UniconfigReplaceOutput = t.TypeOf<typeof UniconfigReplaceOutputValidator>;

export function decodeUniconfigReplaceOutput(value: unknown): UniconfigReplaceOutput {
  return extractResult(UniconfigReplaceOutputValidator.decode(value));
}

const UniconfigSnapshotsOutputValidator = t.type({
  'snapshots-metadata': t.union([
    t.type({}),
    t.type({
      snapshot: t.array(
        t.type({
          name: t.string,
          'creation-time': t.string,
          nodes: t.array(t.string),
        }),
      ),
    }),
  ]),
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
    'overall-status': UniconfigStatusValidator,
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
    'overall-status': UniconfigStatusValidator,
  }),
});
export type UniconfigApplySnapshotOutput = t.TypeOf<typeof UniconfigApplySnapshotOutputValidator>;

export function decodeUniconfigApplySnapshotOutput(value: unknown): UniconfigApplySnapshotOutput {
  return extractResult(UniconfigApplySnapshotOutputValidator.decode(value));
}

const UniconfigDiffInputValidator = t.type({
  input: t.type({
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigDiffInput = t.TypeOf<typeof UniconfigDiffInputValidator>;

export function decodeUniconfigDiffInput(value: unknown): UniconfigDiffInput {
  return extractResult(UniconfigDiffInputValidator.decode(value));
}

const DiffDataValidator = t.type({
  path: t.string,
  data: t.string,
});
const UniconfigDiffOutputValidator = t.type({
  output: t.type({
    'node-results': t.type({
      'node-result': t.array(
        t.type({
          'node-id': t.string,
          'deleted-data': optional(t.array(DiffDataValidator)),
          'updated-data': optional(
            t.array(
              t.type({
                path: t.string,
                'data-actual': t.string,
                'data-intended': t.string,
              }),
            ),
          ),
          'created-data': optional(t.array(DiffDataValidator)),
          status: UniconfigStatusValidator,
        }),
      ),
    }),
    'error-message': optional(t.string),
    'overall-status': UniconfigStatusValidator,
  }),
});
export type UniconfigDiffOutput = t.TypeOf<typeof UniconfigDiffOutputValidator>;

export function decodeUniconfigDiffOuptut(value: unknown): UniconfigDiffOutput {
  return extractResult(UniconfigDiffOutputValidator.decode(value));
}

const UniconfigSyncInputValidator = t.type({
  input: t.type({
    'target-nodes': t.type({
      node: t.array(t.string),
    }),
  }),
});
export type UniconfigSyncInput = t.TypeOf<typeof UniconfigSyncInputValidator>;

export function decodeUniconfigSyncInput(value: unknown): UniconfigSyncInput {
  return extractResult(UniconfigSyncInputValidator.decode(value));
}

const UniconfigSyncOutputValidator = t.type({
  output: t.type({
    'error-message': optional(t.string),
    'overall-status': UniconfigStatusValidator,
    'node-results': t.type({
      'node-result': t.array(
        t.type({
          'node-id': t.string,
          status: UniconfigStatusValidator,
          'error-type': optional(t.union([t.literal('no-connection'), t.literal('processing-error')])),
          'error-message': optional(t.string),
        }),
      ),
    }),
  }),
});
export type UniconfigSyncOutput = t.TypeOf<typeof UniconfigSyncOutputValidator>;

export function decodeUniconfigSyncOutput(value: unknown): UniconfigSyncOutput {
  return extractResult(UniconfigSyncOutputValidator.decode(value));
}

const UniconfigInstallOutputTypeValidator = t.type({
  output: t.type({
    'error-message': optional(t.string),
    status: UniconfigStatusValidator,
  }),
});
export type UniconfigInstallOutput = t.TypeOf<typeof UniconfigInstallOutputTypeValidator>;

export function decodeUniconfigInstallOutput(value: unknown): UniconfigInstallOutput {
  return extractResult(UniconfigInstallOutputTypeValidator.decode(value));
}

export type CheckInstalledNodesInput = {
  input: {
    'target-nodes': {
      node: string[];
    };
  };
};

const CheckInstalledNodesOutputValidator = t.type({
  output: t.type({
    nodes: optional(t.array(t.string)),
  }),
});
export type CheckInstalledNodesOutput = t.TypeOf<typeof CheckInstalledNodesOutputValidator>;

export function decodeInstalledNodeOutput(value: unknown): CheckInstalledNodesOutput {
  return extractResult(CheckInstalledNodesOutputValidator.decode(value));
}

export type UniconfigDeleteSnapshotParams = {
  input: {
    name: string;
  };
};

const UniconfigDeleteSnapshotOutputValidator = t.type({
  output: t.type({
    'error-message': optional(t.string),
    'overall-status': UniconfigStatusValidator,
  }),
});
export type UniconfigDeleteSnapshotOutput = t.TypeOf<typeof UniconfigDeleteSnapshotOutputValidator>;

export function decodeUniconfigDeleteSnapshotOutput(value: unknown): UniconfigDeleteSnapshotOutput {
  return extractResult(UniconfigDeleteSnapshotOutputValidator.decode(value));
}

const SuccessTransaction = t.type({
  'transaction-id': t.string,
  status: t.literal('SUCCESS'),
  'last-commit-time': t.string,
  metadata: t.array(
    t.type({
      'node-id': t.string,
      diff: optional(
        t.array(
          t.type({
            path: t.string,
            'data-before': optional(t.unknown),
            'data-after': t.unknown,
          }),
        ),
      ),
      // topology: t.string,
    }),
  ),
});
const FailedTransaction = t.type({
  'transaction-id': t.string,
  status: t.literal('FAILED'),
  'failed-commit-time': t.string,
});

export type SuccessTransactionType = t.TypeOf<typeof SuccessTransaction>;

const Transaction = t.union([SuccessTransaction, FailedTransaction]);

export type TransactionType = t.TypeOf<typeof Transaction>;

const UniconfigTransactionLogOutputValidator = t.type({
  'transactions-metadata': t.type({
    'transaction-metadata': t.array(Transaction),
  }),
});

export type UniconfigTransactionLogOutput = t.TypeOf<typeof UniconfigTransactionLogOutputValidator>;

export function decodeUniconfigTransactionLogOutput(value: unknown): UniconfigTransactionLogOutput {
  return extractResult(UniconfigTransactionLogOutputValidator.decode(value));
}

export type RevertChangesInput = {
  input: {
    'target-transactions': {
      transaction: string[];
    };
    'ignore-non-existing-nodes': boolean;
  };
};

const UniconfigRevertChangesOutputValidator = t.type({
  output: t.type({
    'revert-output': t.type({
      result: t.array(
        t.type({
          'transaction-id': t.string,
          status: UniconfigStatusValidator,
        }),
      ),
    }),
    'overall-status': UniconfigStatusValidator,
  }),
});

export type UniconfigRevertChangesOutput = t.TypeOf<typeof UniconfigRevertChangesOutputValidator>;

export function decodeUniconfigRevertChangesOutput(value: unknown): UniconfigRevertChangesOutput {
  return extractResult(UniconfigRevertChangesOutputValidator.decode(value));
}
