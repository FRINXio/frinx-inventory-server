import { extendType, nonNull, objectType, stringArg } from 'nexus';
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
