import { arg, extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import { decodeUniconfigConfigInput, UniconfigSnapshotsOutput } from '../external-api/network-types';
import { fromGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';

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
    t.string('config', {
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
        } catch {
          return null;
        }
      },
    });
    t.string('operational', {
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
        } catch {
          return null;
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
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
    t.nonNull.boolean('isOk');
    t.nonNull.string('output');
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const { shouldDryRun } = input;
        const result = shouldDryRun
          ? await uniconfigAPI.postDryRunCommitToNetwork(uniconfigURL, params, transactionId)
          : await uniconfigAPI.postCommitToNetwork(uniconfigURL, params, transactionId);
        return { isOk: result.output['overall-status'] === 'complete', output: JSON.stringify(result.output) };
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const result = await uniconfigAPI.replaceConfig(uniconfigURL, params, args.transactionId);
        if (result.output['overall-status'] === 'fail') {
          throw new Error('error replacing config');
        }
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
        const uniconfigURL = await makeUniconfigURL(prisma, device.uniconfigZoneId);
        const params = {
          input: {
            name: args.input.name,
            'target-nodes': {
              node: [device.name],
            },
          },
        };
        const result = await uniconfigAPI.createSnapshot(uniconfigURL, params, args.transactionId);
        if (result.output['overall-status'] === 'fail') {
          throw new Error('error saving snapshot');
        }

        return {
          snapshot: {
            name: args.input.name,
            createdAt: new Date().toISOString(),
          },
        };
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
        const uniconfigURL = await makeUniconfigURL(prisma, device.uniconfigZoneId);
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
    t.nonNull.string('output');
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            name: args.input.name,
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const result = await uniconfigAPI.applySnapshot(uniconfigURL, params, args.transactionId);

        return {
          isOk: result.output['overall-status'] === 'complete',
          output: JSON.stringify(result.output),
        };
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
export const CalculatedDiffResult = objectType({
  name: 'CalculatedDiffResult',
  definition: (t) => {
    t.field('createdData', { type: nonNull(list(nonNull(CalculatedDiffData))) });
    t.field('deletedData', { type: nonNull(list(nonNull(CalculatedDiffData))) });
    t.field('updatedData', { type: nonNull(list(nonNull(CalculatedDiffData))) });
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const result = await uniconfigAPI.getCalculatedDiff(uniconfigURL, params, args.transactionId);
        if (result.output['overall-status'] === 'fail') {
          throw new Error('error getting calculated diff');
        }
        const [output] = result.output['node-results']['node-result'];
        return {
          result: {
            createdData: output['created-data'] ?? [],
            deletedData: output['deleted-data'] ?? [],
            updatedData: output['edited-data'] ?? [],
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
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const params = {
          input: {
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const response = await uniconfigAPI.syncFromNetwork(uniconfigURL, params, args.transactionId);
        if (response.output['overall-status'] === 'fail') {
          return { dataStore: null };
        }
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

export const CreateTransactionPayload = objectType({
  name: 'CreateTransactionPayload',
  definition: (t) => {
    t.string('transactionId');
  },
});

export const CreateTransactionMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('createTransaction', {
      type: CreateTransactionPayload,
      args: { deviceId: nonNull(stringArg()) },
      resolve: async (_, args, { uniconfigAPI, prisma, tenantId }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId, tenantId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const transactionId = await uniconfigAPI.createTransaction(uniconfigURL);
        return { transactionId };
      },
    });
  },
});

export const CloseTransactionPayload = objectType({
  name: 'CloseTransactionPayload',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});

export const CloseTransactionMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('closeTransaction', {
      type: CloseTransactionPayload,
      args: { deviceId: nonNull(stringArg()), transactionId: nonNull(stringArg()) },
      resolve: async (_, args, { uniconfigAPI, prisma, tenantId }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId, tenantId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        await uniconfigAPI.closeTransaction(uniconfigURL, args.transactionId);
        return { isOk: true };
      },
    });
  },
});
