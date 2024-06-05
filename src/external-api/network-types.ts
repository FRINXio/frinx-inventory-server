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

const CheckNodesConnectionOutputTypeValidator = t.type({
  errors: t.type({
    error: t.array(
      t.type({
        'error-message': optional(t.string),
      }),
    ),
  }),
});

export type CheckNodesConnectionOutput = {
  output: {
    'error-message'?: string;
    status: 'complete' | 'fail';
  };
};

export type CheckNodesConnectionErrorOutput = t.TypeOf<typeof CheckNodesConnectionOutputTypeValidator>;

export function decodeCheckNodesConnectionOutput(value: unknown): CheckNodesConnectionErrorOutput {
  return extractResult(CheckNodesConnectionOutputTypeValidator.decode(value));
}

export type CheckNodesConnectionInput = {
  input: {
    'target-nodes': {
      node: string[];
    };
    'connection-timeout': 2;
  };
};

export type UninstallDeviceInput = {
  input: {
    'node-id': string;
    'connection-type': 'netconf' | 'cli' | 'gnmi';
  };
};

export type UninstallMultipleDevicesInput = {
  input: {
    nodes: {
      'node-id': string;
      'connection-type': 'netconf' | 'cli' | 'gnmi';
    }[];
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
    'do-confirmed-commit': t.boolean,
    'do-rollback': t.boolean,
    'skip-unreachable-nodes': t.boolean,
    'do-validate': t.boolean,
  }),
});
export type UniconfigCommitInput = t.TypeOf<typeof UniconfigCommitInputValidator>;

const UniconfigDryRunCommitInputValidator = t.type({
  input: t.type({
    'do-rollback': t.boolean,
  }),
});
export type UniconfigDryRunCommitInput = t.TypeOf<typeof UniconfigDryRunCommitInputValidator>;

export function decodeUniconfigCommitInput(value: unknown): UniconfigCommitInput {
  return extractResult(UniconfigCommitInputValidator.decode(value));
}

const UniconfigStatusValidator = t.union([t.literal('complete'), t.literal('fail')]);

const UniconfigDryRunCommitOutputValidator = t.type({
  output: t.type({
    'node-results': t.type({
      'node-result': t.array(
        t.type({
          'node-id': t.string,
          configuration: t.string,
        }),
      ),
    }),
  }),
});

export type UniconfigDryRunCommitOutput = t.TypeOf<typeof UniconfigDryRunCommitOutputValidator>;

export function decodeUniconfigDryRunCommitOutput(value: unknown): UniconfigDryRunCommitOutput {
  return extractResult(UniconfigDryRunCommitOutputValidator.decode(value));
}

const UniconfigDryRunCommitErrorValidator = t.type({
  errors: t.type({
    error: t.array(
      t.type({
        'error-message': t.string,
        'error-info': t.type({
          'node-id': t.string,
        }),
      }),
    ),
  }),
});

export type UniconfigDryRunCommitError = t.TypeOf<typeof UniconfigDryRunCommitErrorValidator>;

export function decodeUniconfigDryRunCommitErrorOutput(value: unknown): UniconfigDryRunCommitError {
  return extractResult(UniconfigDryRunCommitErrorValidator.decode(value));
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
        }),
      ),
    }),
  }),
});
export type UniconfigDiffOutput = t.TypeOf<typeof UniconfigDiffOutputValidator>;

export function decodeUniconfigDiffOuptut(value: unknown): UniconfigDiffOutput {
  return extractResult(UniconfigDiffOutputValidator.decode(value));
}

const SnapshotMetadata = t.type({
  name: t.string,
  nodes: t.array(t.string),
  'creation-time': t.string,
});

const UniconfigSyncInputValidator = t.type({
  snapshot: t.array(SnapshotMetadata),
});
export type UniconfigSyncInput = t.TypeOf<typeof UniconfigSyncInputValidator>;

export function decodeUniconfigSyncInput(value: unknown): UniconfigSyncInput {
  return extractResult(UniconfigSyncInputValidator.decode(value));
}

const UniconfigInstallOutputTypeValidator = t.type({
  errors: t.type({
    error: t.array(
      t.type({
        'error-message': optional(t.string),
      }),
    ),
  }),
});

export type UniconfigInstallOutput = {
  output: {
    'error-message'?: string;
    status: 'complete' | 'fail';
  };
};

export type UniconfigInstallErrorOutput = t.TypeOf<typeof UniconfigInstallOutputTypeValidator>;

export function decodeUniconfigInstallOutput(value: unknown): UniconfigInstallErrorOutput {
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
    'node-results': t.type({
      'node-result': optional(
        t.array(
          t.type({
            'node-id': t.string,
            'uniconfig-layer': t.boolean,
            'topology-id': t.string,
          }),
        ),
      ),
    }),
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

const UniconfigExternalStorageOutputValidator = t.record(t.string, t.string);

export type UniconfigExternalStorageOutput = t.TypeOf<typeof UniconfigExternalStorageOutputValidator>;

export function decodeUniconfigExternalStorageOutput(value: unknown): UniconfigExternalStorageOutput {
  return extractResult(UniconfigExternalStorageOutputValidator.decode(value));
}

const UniconfigMultipleNodesOutputValidator = t.type({
  output: t.type({
    'node-results': t.array(
      t.type({
        'node-id': t.string,
        status: UniconfigStatusValidator,
        'error-message': optional(t.string),
      }),
    ),
  }),
});

export type UniconfigMultipleNodesOutput = t.TypeOf<typeof UniconfigMultipleNodesOutputValidator>;

export function decodeUniconfigMultipleNodesOutput(value: unknown): UniconfigMultipleNodesOutput {
  return extractResult(UniconfigMultipleNodesOutputValidator.decode(value));
}
