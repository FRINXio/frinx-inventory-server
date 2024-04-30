import { objectType, subscriptionField, nonNull, stringArg, intArg } from 'nexus';
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
