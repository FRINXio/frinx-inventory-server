import { objectType, subscriptionField, nonNull, stringArg, intArg, list } from 'nexus';
import { DeviceLoadUsage } from '../external-api/performance-monitoring-graphql';
import { asyncGenerator } from '../helpers/async-generator';

export const DeviceUsage = objectType({
  name: 'DeviceUsage',
  definition: (t) => {
    t.float('cpuLoad');
    t.float('memoryLoad');
  },
});

export const DeviceUsageSubscription = subscriptionField('deviceUsage', {
  type: DeviceUsage,
  args: {
    deviceName: nonNull(stringArg()),
    refreshEverySec: intArg(),
  },
  subscribe: async (_, { deviceName, refreshEverySec }, { performanceMonitoringAPI }) =>
    asyncGenerator<DeviceLoadUsage>(
      (refreshEverySec || 10) * 1000,
      async () => {
        if (performanceMonitoringAPI == null) {
          return { cpuUsage: null, memoryUsage: null };
        }

        return performanceMonitoringAPI.getDeviceLoadUsage(deviceName);
      },
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
    t.float('cpuLoad');
    t.float('memoryLoad');
  },
});

export const DeviceListUsage = objectType({
  name: 'DeviceListUsage',
  definition: (t) => {
    t.nonNull.list.nonNull.field('devicesUsage', {
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
  subscribe: async (_, { deviceNames, refreshEverySec }, { performanceMonitoringAPI }) =>
    asyncGenerator(
      (refreshEverySec || 10) * 1000,
      async () => {
        if (performanceMonitoringAPI == null) {
          return [];
        }

        const usages = await performanceMonitoringAPI.getDeviceLoadUsages(deviceNames);

        return usages.map(({ cpuUsage, deviceName, memoryUsage }) => ({
          deviceName,
          cpuLoad: cpuUsage,
          memoryLoad: memoryUsage,
        }));
      },
      () => true,
    ),
  resolve: (data) => ({
    devicesUsage: data,
  }),
});
