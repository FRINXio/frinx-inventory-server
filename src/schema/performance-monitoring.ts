import { objectType, subscriptionField, nonNull, stringArg, intArg, list, arg, inputObjectType } from 'nexus';
import { DeviceLoadUsage } from '../external-api/performance-monitoring-graphql';
import { asyncGenerator } from '../helpers/async-generator';
import { CheckNodesConnectionOutput } from '../external-api/network-types';
import { getUniconfigURL } from '../helpers/zone.helpers';
import uniconfigAPI from '../external-api/uniconfig';

export const NodesConnection = objectType({
  name: 'NodesConnection',
  definition: (t) => {
    t.string('status');
  },
});

export const TargetNodes = inputObjectType({
  name: 'TargetNodes',
  definition: (t) => {
    t.nonNull.list.nonNull.string('targetNode');
  },
});

export const NodesConnectionInput = inputObjectType({
  name: 'NodesConnectionInput',
  definition: (t) => {
    t.nonNull.list.nonNull.field('targetNodes', { type: 'TargetNodes' });
    t.nonNull.int('connectionTimeout');
  },
});

export const NodesConnectionSubscription = subscriptionField('nodesConnection', {
  type: 'NodesConnection',
  args: {
    input: arg({ type: nonNull('NodesConnectionInput') }),
  },
  subscribe: async (_, { input }, { prisma }) =>
    asyncGenerator<CheckNodesConnectionOutput>(
      (input.connectionTimeout || 10) * 1000,
      async () => {
        const zones = await prisma.uniconfigZone.findMany({
          select: { id: true },
        });

        const uniconfigZoneIds = [...new Set(zones.map((zone) => zone.id))];
        const devices = uniconfigZoneIds.map((zoneId) => {
          return prisma.device.findMany({
            where: {
              uniconfigZoneId: zoneId,
              name: {
                in: input.targetNodes[0].targetNode
              }
            },
          });
        });

        const devicesResults = await Promise.all(devices);
        const allDevices = devicesResults.flat().map((device) => ({
          deviceName: device.name,
          uniconfigZoneId: device.uniconfigZoneId,
        }));

        console.log(allDevices);

        if (uniconfigAPI == null) {
          return { output: { status: 'fail' } };
        }

        const deviceReachability = await Promise.all(
          allDevices.map(async (device) => {
            const uniconfigURL = await getUniconfigURL(prisma, device.uniconfigZoneId);
            return uniconfigAPI.getNodesConnection(uniconfigURL, device.deviceName);
          }),
        );
        console.log(devicesResults);
        

        return deviceReachability;
      },
      () => true,
    ),
  resolve: (data) => ({
    status: data.output.status,
  }),
});

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
