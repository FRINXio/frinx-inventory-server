import { arg, extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import { ExternalApiError } from '../external-api/errors';
import {
  decodeUniconfigConfigInput,
  // UniconfigCommitOutput,
  UniconfigDryRunCommitOutput,
  UniconfigSnapshotsOutput,
} from '../external-api/network-types';
import { fromGraphId } from '../helpers/id-helper';
import { getUniconfigURL } from '../helpers/zone.helpers';

function getSnapshotsFromResponse(snapshotResponse: UniconfigSnapshotsOutput, deviceName: string) {
  if ('snapshot' in snapshotResponse['snapshots-metadata']) {
    return snapshotResponse['snapshots-metadata'].snapshot
      .filter((s) => s.nodes.includes(deviceName))
      .map((s) => ({
        name: s.name,
        createdAt: s['creation-time'],
      }));
  }
  return [];
}

function getDryRunCommitOutputFromResponse(commitResponse: UniconfigDryRunCommitOutput) {
  if ('overall-status' in commitResponse.output && 'node-results' in commitResponse.output) {
    return commitResponse.output;
  }
  return null;
}

// function getCommitOutputFromResponse(commitResponse: UniconfigCommitOutput) {
//   if ('overall-status' in commitResponse.output && 'node-results' in commitResponse.output) {
//     return commitResponse.output;
//   }
//   return null;
// }

export const Snapshot = objectType({
  name: 'Snapshot',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('createdAt');
  },
});

export const DataStore = objectType({
  name: 'DataStore',
  definition: (t) => {
    t.nonNull.string('config', {
      resolve: async (root, _, { uniconfigAPI }) => {
        try {
          const config = await uniconfigAPI.getUniconfigDatastore(
            root.$uniconfigURL,
            {
              nodeId: root.$deviceName,
              datastoreType: 'config',
            },
            root.$transactionId,
          );
          return JSON.stringify(config);
        } catch (e) {
          if (e instanceof ExternalApiError && e.code === 403) {
            throw new Error('TRANSACTION_EXPIRED');
          }
          throw e;
        }
      },
    });
    t.nonNull.string('operational', {
      resolve: async (root, _, { uniconfigAPI }) => {
        try {
          const operational = await uniconfigAPI.getUniconfigDatastore(
            root.$uniconfigURL,
            {
              nodeId: root.$deviceName,
              datastoreType: 'operational',
            },
            root.$transactionId,
          );
          return JSON.stringify(operational);
        } catch (e) {
          if (e instanceof ExternalApiError && e.code === 403) {
            throw new Error('TRANSACTION_EXPIRED');
          }
          throw e;
        }
      },
    });
    t.nonNull.field('snapshots', {
      type: nonNull(list(nonNull(Snapshot))),
      resolve: async (root, _, { uniconfigAPI }) => {
        try {
          const response = await uniconfigAPI.getSnapshots(root.$uniconfigURL, root.$transactionId);
          const snapshots = getSnapshotsFromResponse(response, root.$deviceName);
          return snapshots;
        } catch {
          return [];
        }
      },
    });
  },
});

export const DataStoreQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('dataStore', {
      type: DataStore,
      args: {
        deviceId: nonNull(stringArg()),
        transactionId: nonNull(stringArg()),
      },
      resolve: async (_, { deviceId, transactionId }, { prisma }) => {
        const nativeDeviceId = fromGraphId('Device', deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          return null;
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        return {
          $deviceName: dbDevice.name,
          $uniconfigURL: uniconfigURL,
          $transactionId: transactionId,
        };
      },
    });
  },
});
export const UpdateDataStoreInput = inputObjectType({
  name: 'UpdateDataStoreInput',
  definition: (t) => {
    t.nonNull.string('config');
  },
});
export const UpdateDataStorePayload = objectType({
  name: 'UpdateDataStorePayload',
  definition: (t) => {
    t.nonNull.field('dataStore', { type: DataStore });
  },
});
export const UpdateDataStoreMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateDataStore', {
      type: UpdateDataStorePayload,
      args: {
        deviceId: nonNull(stringArg()),
        transactionId: nonNull(stringArg()),
        input: nonNull(arg({ type: UpdateDataStoreInput })),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const { deviceId, input } = args;
        const nativeDeviceId = fromGraphId('Device', deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = JSON.parse(input.config);
        await uniconfigAPI.updateUniconfigDataStore(
          uniconfigURL,
          dbDevice.name,
          decodeUniconfigConfigInput(params),
          args.transactionId,
        );
        return {
          dataStore: {
            $deviceName: dbDevice.name,
            $uniconfigURL: uniconfigURL,
            $transactionId: args.transactionId,
          },
        };
      },
    });
  },
});

export const CommitConfigOutput = objectType({
  name: 'CommitConfigOutput',
  definition: (t) => {
    t.nonNull.string('deviceId');
    t.string('message');
    t.string('configuration');
  },
});
export const CommitConfigInput = inputObjectType({
  name: 'CommitConfigInput',
  definition: (t) => {
    t.nonNull.string('deviceId');
    t.boolean('shouldDryRun');
  },
});
export const CommitConfigPayload = objectType({
  name: 'CommitConfigPayload',
  definition: (t) => {
    t.nonNull.field('output', { type: CommitConfigOutput });
  },
});
export const CommitConfigMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('commitConfig', {
      type: CommitConfigPayload,
      args: {
        transactionId: nonNull(stringArg()),
        input: nonNull(arg({ type: CommitConfigInput })),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const { input, transactionId } = args;
        const nativeDeviceId = fromGraphId('Device', input.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const { shouldDryRun } = input;

        if (shouldDryRun) {
          const dryRunParams = {
            input: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'do-rollback': true,
            },
          };
          const dryRunResult = await uniconfigAPI.postDryRunCommitToNetwork(uniconfigURL, dryRunParams, transactionId);
          const output = getDryRunCommitOutputFromResponse(dryRunResult);
          const status = output?.['overall-status'];
          return {
            output: {
              deviceId: args.input.deviceId,
              configuration: status === 'complete' ? output?.['node-results']['node-result'][0].configuration : null,
              message: status === 'fail' ? output?.['node-results']['node-result'][0]['error-message'] ?? null : null,
            },
          };
        }

        const params = {
          input: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'do-confirmed-commit': true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'do-rollback': true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'skip-unreachable-nodes': true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'do-validate': true,
          },
        };
        await uniconfigAPI.postCommitToNetwork(uniconfigURL, params, transactionId);
        return {
          output: {
            deviceId: args.input.deviceId,
            configuration: null,
            message: 'complete',
          },
        };
      },
    });
  },
});

export const ResetConfigPayload = objectType({
  name: 'ResetConfigPayload',
  definition: (t) => {
    t.nonNull.field('dataStore', { type: DataStore });
  },
});
export const ResetConfigMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('resetConfig', {
      type: ResetConfigPayload,
      args: {
        deviceId: nonNull(stringArg()),
        transactionId: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };

        try {
          await uniconfigAPI.replaceConfig(uniconfigURL, params, args.transactionId);
          return {
            dataStore: {
              $deviceName: dbDevice.name,
              $uniconfigURL: uniconfigURL,
              $transactionId: args.transactionId,
            },
          };
        } catch {
          throw new Error('error replacing config');
        }
      },
    });
  },
});

export const AddSnapshotPayload = objectType({
  name: 'AddSnapshotPayload',
  definition: (t) => {
    t.field('snapshot', { type: Snapshot });
  },
});
export const AddSnasphotInput = inputObjectType({
  name: 'AddSnapshotInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('deviceId');
  },
});
export const AddSnapshotMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.field('addSnapshot', {
      type: AddSnapshotPayload,
      args: {
        input: nonNull(arg({ type: AddSnasphotInput })),
        transactionId: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.input.deviceId);
        const device = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (device == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        const params = {
          input: {
            name: args.input.name,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'target-nodes': {
              node: [device.name],
            },
          },
        };
        try {
          await uniconfigAPI.createSnapshot(uniconfigURL, params, args.transactionId);

          return {
            snapshot: {
              name: args.input.name,
              createdAt: new Date().toISOString(),
            },
          };
        } catch {
          throw new Error('error saving snapshot');
        }
        // if (result.output['overall-status'] === 'fail') {
        //   throw new Error('error saving snapshot');
        // }
      },
    });
  },
});

export const DeleteSnapshotPayload = objectType({
  name: 'DeleteSnapshotPayload',
  definition: (t) => {
    t.field('snapshot', { type: Snapshot });
  },
});
export const DeleteSnapshotInput = inputObjectType({
  name: 'DeleteSnapshotInput',
  definition: (t) => {
    t.nonNull.string('deviceId');
    t.nonNull.string('name');
    t.nonNull.string('transactionId');
  },
});
export const DeleteSnapshotMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.field('deleteSnapshot', {
      type: DeleteSnapshotPayload,
      args: {
        input: nonNull(arg({ type: DeleteSnapshotInput })),
      },
      resolve: async (_, args, { prisma, tenantId, uniconfigAPI }) => {
        const { deviceId, name, transactionId } = args.input;
        const nativeDeviceId = fromGraphId('Device', deviceId);
        const device = await prisma.device.findFirst({ where: { id: nativeDeviceId, tenantId } });
        if (device == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
        const response = await uniconfigAPI.getSnapshots(uniconfigURL, transactionId);
        const snapshots = getSnapshotsFromResponse(response, device.name);
        const snapshot = snapshots.find((s) => s.name === name);
        if (snapshot == null) {
          throw new Error('snapshot not found');
        }
        await uniconfigAPI.deleteSnapshot(uniconfigURL, { input: { name } }, transactionId);
        return { snapshot };
      },
    });
  },
});

export const ApplySnapshotInput = inputObjectType({
  name: 'ApplySnapshotInput',
  definition: (t) => {
    t.nonNull.string('deviceId');
    t.nonNull.string('name');
  },
});
export const ApplySnapshotPayload = objectType({
  name: 'ApplySnapshotPayload',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});
export const ApplySnapshotMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('applySnapshot', {
      type: ApplySnapshotPayload,
      args: {
        input: nonNull(arg({ type: ApplySnapshotInput })),
        transactionId: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.input.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            name: args.input.name,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };

        try {
          await uniconfigAPI.applySnapshot(uniconfigURL, params, args.transactionId);

          return {
            isOk: true,
          };
        } catch {
          return {
            isOk: false,
          };
        }
      },
    });
  },
});

export const CalculatedDiffData = objectType({
  name: 'DiffData',
  definition: (t) => {
    t.nonNull.string('path');
    t.nonNull.string('data');
  },
});
export const CalculatedUpdateDiffData = objectType({
  name: 'CalculatedUpdateDiffData',
  definition: (t) => {
    t.nonNull.string('path');
    t.nonNull.string('intendedData');
    t.nonNull.string('actualData');
  },
});
export const CalculatedDiffResult = objectType({
  name: 'CalculatedDiffResult',
  definition: (t) => {
    t.field('createdData', { type: nonNull(list(nonNull(CalculatedDiffData))) });
    t.field('deletedData', { type: nonNull(list(nonNull(CalculatedDiffData))) });
    t.field('updatedData', { type: nonNull(list(nonNull(CalculatedUpdateDiffData))) });
  },
});
export const CalculatedDiffPayload = objectType({
  name: 'CalculatedDiffPayload',
  definition: (t) => {
    t.nonNull.field('result', { type: CalculatedDiffResult });
  },
});
export const CalculatedDiffQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('calculatedDiff', {
      type: CalculatedDiffPayload,
      args: {
        deviceId: nonNull(stringArg()),
        transactionId: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const result = await uniconfigAPI.getCalculatedDiff(uniconfigURL, params, args.transactionId);
        const [output] = result.output['node-results']['node-result'];
        return {
          result: {
            createdData: output['created-data'] ?? [],
            deletedData: output['deleted-data'] ?? [],
            updatedData: output['updated-data']
              ? output['updated-data'].map((d) => ({
                  path: d.path,
                  intendedData: d['data-intended'],
                  actualData: d['data-actual'],
                }))
              : [],
          },
        };
      },
    });
  },
});

export const SyncFromNetworkPayload = objectType({
  name: 'SyncFromNetworkPayload',
  definition: (t) => {
    t.field('dataStore', { type: DataStore });
  },
});
export const SyncFromNetworkMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('syncFromNetwork', {
      type: SyncFromNetworkPayload,
      args: { deviceId: nonNull(stringArg()), transactionId: nonNull(stringArg()) },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          snapshot: [
            {
              name: 'snapshot',
              nodes: [dbDevice.name],
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'creation-time': Date.now().toString(),
            },
          ],
        };
        try {
          await uniconfigAPI.syncFromNetwork(uniconfigURL, params, args.transactionId);

          return {
            dataStore: {
              $deviceName: dbDevice.name,
              $uniconfigURL: uniconfigURL,
              $transactionId: args.transactionId,
            },
          };
        } catch {
          return { dataStore: null };
        }
      },
    });
  },
});
