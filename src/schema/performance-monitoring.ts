import { objectType, subscriptionField, nonNull, stringArg, intArg, list } from 'nexus';
import { DeviceLoadUsage } from '../external-api/performance-monitoring-graphql';
import { asyncGenerator } from '../helpers/async-generator';
import { getUniconfigURL } from '../helpers/zone.helpers';
import uniconfigAPI from '../external-api/uniconfig';

export const DeviceStatus = objectType({
  name: 'DeviceStatus',
  definition: (t) => {
    t.string('status');
    t.string('deviceName');
  },
});

export const DevicesConnection = objectType({
  name: 'DevicesConnection',
  definition: (t) => {
    t.list.field('deviceStatuses', { type: 'DeviceStatus' });
  },
});

/* eslint-disable arrow-body-style */
export const DevicesConnectionSubscription = subscriptionField('devicesConnection', {
  type: 'DevicesConnection',
  args: {
    targetDevices: nonNull(list(nonNull(stringArg()))),
    connectionTimeout: intArg(),
  },
  subscribe: async (_, { targetDevices, connectionTimeout }, { prisma }) => {
    const zones = await prisma.uniconfigZone.findMany({
      select: { id: true },
    });

    const uniconfigZoneIds = [...new Set(zones.map((zone) => zone.id))];
    const devices = uniconfigZoneIds.map((zoneId) => {
      return prisma.device.findMany({
        where: {
          uniconfigZoneId: zoneId,
          name: {
            in: targetDevices,
          },
        },
      });
    });
    const devicesResults = await Promise.all(devices);
    const allDevices = devicesResults.flat().map((device) => ({
      deviceName: device.name,
      uniconfigZoneId: device.uniconfigZoneId,
    }));

    return asyncGenerator(
      (connectionTimeout || 10) * 1000,
      async () => {
        const deviceReachability = await Promise.all(
          allDevices.map(async (device) => {
            if (uniconfigAPI == null) {
              return { deviceName: device.deviceName, status: 'offline' };
            }
            const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
            const connectionStatus = await uniconfigAPI.getNodesConnection(uniconfigURL, device.deviceName);

            return { deviceName: device.deviceName, status: connectionStatus.output.status };
          }),
        );

        return deviceReachability;
      },
      () => true,
    );
  },
  resolve: (data) => ({
    deviceStatuses: data,
  }),
});
/* eslint-enable arrow-body-style */

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
