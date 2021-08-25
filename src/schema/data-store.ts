import { arg, extendType, inputObjectType, list, nonNull, objectType, stringArg } from 'nexus';
import { decodeUniconfigConfigInput } from '../external-api/network-types';
import { fromGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';

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
          const config = await uniconfigAPI.getUniconfigDatastore(root.$uniconfigURL, {
            nodeId: root.$deviceName,
            datastoreType: 'config',
          });
          return JSON.stringify(config);
        } catch {
          return null;
        }
      },
    });
    t.string('operational', {
      resolve: async (root, _, { uniconfigAPI }) => {
        try {
          const operational = await uniconfigAPI.getUniconfigDatastore(root.$uniconfigURL, {
            nodeId: root.$deviceName,
            datastoreType: 'operational',
          });
          return JSON.stringify(operational);
        } catch {
          return null;
        }
      },
    });
    t.nonNull.field('snapshots', {
      type: list(nonNull(Snapshot)),
      resolve: async (root, _, { uniconfigAPI }) => {
        try {
          const response = await uniconfigAPI.getSnapshots(root.$uniconfigURL);
          const snapshotMetadata =
            'snapshot' in response['snapshots-metadata'] ? response['snapshots-metadata'] : undefined;
          const snapshots =
            snapshotMetadata?.snapshot.map((s) => ({ name: s.name, createdAt: s['creation-time'] })) ?? [];
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
      },
      resolve: async (_, { deviceId }, { prisma }) => {
        const nativeDeviceId = fromGraphId('Device', deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          return null;
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        return {
          $deviceName: dbDevice.name,
          $uniconfigURL: uniconfigURL,
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
        await uniconfigAPI.updateUniconfigDataStore(uniconfigURL, dbDevice.name, decodeUniconfigConfigInput(params));
        return {
          dataStore: {
            $deviceName: dbDevice.name,
            $uniconfigURL: uniconfigURL,
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
        input: nonNull(arg({ type: CommitConfigInput })),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const { input } = args;
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
          ? await uniconfigAPI.postDryRunCommitToNetwork(uniconfigURL, params)
          : await uniconfigAPI.postCommitToNetwork(uniconfigURL, params);
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
        const result = await uniconfigAPI.replaceConfig(uniconfigURL, params);
        if (result.output['overall-status'] === 'fail') {
          throw new Error('error replacing config');
        }
        return {
          dataStore: {
            $deviceName: dbDevice.name,
            $uniconfigURL: uniconfigURL,
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
        const result = await uniconfigAPI.createSnapshot(uniconfigURL, params);
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
        const result = await uniconfigAPI.applySnapshot(uniconfigURL, params);

        return {
          isOk: result.output['overall-status'] === 'complete',
          output: JSON.stringify(result.output),
        };
      },
    });
  },
});

export const CalculatedDiffPayload = objectType({
  name: 'CalculatedDiffPayload',
  definition: (t) => {
    t.string('output');
  },
});
export const CalculatedDiffQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('calculatedDiff', {
      type: CalculatedDiffPayload,
      args: {
        deviceId: nonNull(stringArg()),
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
        const result = await uniconfigAPI.getCalculatedDiff(uniconfigURL, params);
        if (result.output['overall-status'] === 'fail') {
          throw new Error('error getting calculated diff');
        }
        return { output: JSON.stringify(result.output['node-results']['node-result'][0]) };
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
      args: { deviceId: nonNull(stringArg()) },
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
        const response = await uniconfigAPI.syncFromNetwork(uniconfigURL, params);
        if (response.output['overall-status'] === 'fail') {
          return { dataStore: null };
        }
        return {
          dataStore: {
            $deviceName: dbDevice.name,
            $uniconfigURL: uniconfigURL,
          },
        };
      },
    });
  },
});
