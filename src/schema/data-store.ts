import { arg, extendType, inputObjectType, nonNull, objectType, stringArg } from 'nexus';
import { decodeUniconfigConfigInput } from '../external-api/network-types';
import { fromGraphId } from '../helpers/id-helper';
import { makeUniconfigURL } from '../helpers/zone.helpers';

export const DataStore = objectType({
  name: 'DataStore',
  definition: (t) => {
    t.string('config');
    t.string('operational');
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
      resolve: async (_, { deviceId }, { uniconfigAPI, prisma }) => {
        const nativeDeviceId = fromGraphId('Device', deviceId);
        const dbDevice = await prisma.device_inventory.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          return null;
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          return null;
        }
        try {
          const config = await uniconfigAPI.getUniconfigDatastore(uniconfigURL, {
            nodeId: dbDevice.name,
            datastoreType: 'config',
          });
          const operational = await uniconfigAPI.getUniconfigDatastore(uniconfigURL, {
            nodeId: dbDevice.name,
            datastoreType: 'operational',
          });
          return {
            config: JSON.stringify(config),
            operational: JSON.stringify(operational),
          };
        } catch (e) {
          return null;
        }
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
        const dbDevice = await prisma.device_inventory.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
        const params = JSON.parse(input.config);
        await uniconfigAPI.updateUniconfigDataStore(uniconfigURL, dbDevice.name, decodeUniconfigConfigInput(params));
        const config = await uniconfigAPI.getUniconfigDatastore(uniconfigURL, {
          nodeId: dbDevice.name,
          datastoreType: 'config',
        });
        const operational = await uniconfigAPI.getUniconfigDatastore(uniconfigURL, {
          nodeId: dbDevice.name,
          datastoreType: 'operational',
        });
        return {
          dataStore: {
            config: JSON.stringify(config),
            operational: JSON.stringify(operational),
          },
        };
      },
    });
  },
});

export const CommitConfigPayload = objectType({
  name: 'CommitConfigPayload',
  definition: (t) => {
    t.boolean('isOk');
  },
});

export const CommitConfigMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('commitConfig', {
      type: CommitConfigPayload,
      args: {
        deviceId: nonNull(stringArg()),
      },
      resolve: async (_, args, { prisma, uniconfigAPI }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device_inventory.findFirst({ where: { id: nativeDeviceId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfig_zone);
        if (uniconfigURL == null) {
          throw new Error('should never happen');
        }
        const params = {
          input: {
            'target-nodes': {
              node: [dbDevice.name],
            },
          },
        };
        const result = await uniconfigAPI.postCommitToNetwork(uniconfigURL, params);
        return { isOk: result.output['overall-status'] === 'complete' };
      },
    });
  },
});
