import { objectType, subscriptionField, nonNull, stringArg, intArg, list } from 'nexus';
import performanceMonitoringAPI, { DeviceLoadUsage } from '../external-api/performance-monitoring';
import { asyncGenerator } from '../helpers/async-generator';

export const DeviceUsage = objectType({
  name: 'DeviceUsage',
  definition: (t) => {
    t.nonNull.float('cpuLoad');
    t.nonNull.float('memoryLoad');
  },
});

export const DeviceUsageSubscription = subscriptionField('deviceUsage', {
  type: DeviceUsage,
  args: {
    deviceName: nonNull(stringArg()),
    refreshEverySec: intArg(),
  },
  subscribe: async (_, { deviceName, refreshEverySec }) =>
    asyncGenerator<DeviceLoadUsage>(
      (refreshEverySec || 10) * 1000,
      () => performanceMonitoringAPI().getDeviceLoadUsage(deviceName),
      () => true,
    ),
  resolve: (data) => ({
    cpuLoad: data.cpuUsage,
    memoryLoad: data.memoryUsage,
  }),
});

export const DevicesUsage = objectType({
  name: 'DevicesUsage',
  definition: (t) => {
    t.nonNull.string('deviceName');
    t.nonNull.float('cpuLoad');
    t.nonNull.float('memoryLoad');
  },
});

export const DeviceListUsage = objectType({
  name: 'DeviceListUsage',
  definition: (t) => {
    t.nonNull.list.field('devicesUsage', {
      type: DevicesUsage,
    });
  },
});

export const DevicesUsageSubscription = subscriptionField('devicesUsage', {
  type: DeviceListUsage,
  args: {
    deviceNames: nonNull(list(nonNull(stringArg()))),
    refreshEverySec: intArg(),
  },
  subscribe: async (_, { deviceNames, refreshEverySec }) =>
    asyncGenerator(
      (refreshEverySec || 10) * 1000,
      async () => {
        const promises = deviceNames.map((deviceName) => performanceMonitoringAPI().getDeviceLoadUsage(deviceName));
        const devicesLoads = await Promise.all(promises);

        return devicesLoads.map((deviceLoad, index) => ({
          deviceName: deviceNames[index],
          cpuLoad: deviceLoad.cpuUsage,
          memoryLoad: deviceLoad.memoryUsage,
        }));
      },
      () => true,
    ),
  resolve: (data) => ({
    devicesUsage: data,
  }),
});
