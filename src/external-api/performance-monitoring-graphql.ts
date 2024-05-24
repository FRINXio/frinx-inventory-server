import { gql, GraphQLClient } from 'graphql-request';
import config from '../config';
import {
  CurrentCpuUsageQuery,
  CurrentCpuUsageQueryVariables,
  CurrentCpuUsagesQuery,
  CurrentCpuUsagesQueryVariables,
  CurrentMemoryUsageQuery,
  CurrentMemoryUsageQueryVariables,
  CurrentMemoryUsagesQuery,
  CurrentMemoryUsagesQueryVariables,
} from '../__generated__/perf-monitoring.graphql';

export type DeviceLoadUsage = {
  cpuUsage: number | null;
  memoryUsage: number | null;
};

const DEVICE_MEMORY_USAGES = gql`
  query CurrentMemoryUsages($names: [String!]!) {
    currentMemoryUsages(devices: $names) {
      device
      usage
    }
  }
`;

const DEVICE_CPU_USAGES = gql`
  query CurrentCpuUsages($names: [String!]!) {
    currentCpuUsages(devices: $names) {
      device
      usage
    }
  }
`;

const DEVICE_MEMORY_USAGE = gql`
  query CurrentMemoryUsage($name: String!) {
    currentMemoryUsage(device: $name) {
      device
      usage
    }
  }
`;

const DEVICE_CPU_USAGE = gql`
  query CurrentCpuUsage($name: String!) {
    currentCpuUsage(device: $name) {
      device
      usage
    }
  }
`;

function getPerformanceMonitoringAPI() {
  if (config.performanceMonitoringEnabled === false) {
  if (config.topologyEnabled === false) {
    return undefined;
  }

  const client = new GraphQLClient(config.performanceMonitoringGraphqlURL);

  async function getDeviceCpuUsage(deviceName: string): Promise<CurrentCpuUsageQuery> {
    const result = await client.request<CurrentCpuUsageQuery, CurrentCpuUsageQueryVariables>(DEVICE_CPU_USAGE, {
      name: deviceName,
    });

    return result;
  }

  async function getDeviceMemoryUsage(deviceName: string): Promise<CurrentMemoryUsageQuery> {
    const result = await client.request<CurrentMemoryUsageQuery, CurrentMemoryUsageQueryVariables>(
      DEVICE_MEMORY_USAGE,
      { name: deviceName },
    );

    return result;
  }

  async function getDeviceCpuUsages(deviceNames: string[]): Promise<CurrentCpuUsagesQuery> {
    const result = await client.request<CurrentCpuUsagesQuery, CurrentCpuUsagesQueryVariables>(DEVICE_CPU_USAGES, {
      names: deviceNames,
    });

    return result;
  }

  async function getDeviceMemoryUsages(deviceNames: string[]): Promise<CurrentMemoryUsagesQuery> {
    const result = await client.request<CurrentMemoryUsagesQuery, CurrentMemoryUsagesQueryVariables>(
      DEVICE_MEMORY_USAGES,
      { names: deviceNames },
    );

    return result;
  }

  async function getDeviceLoadUsage(deviceName: string): Promise<DeviceLoadUsage> {
    const [cpuUsage, memoryUsage] = await Promise.all([
      getDeviceCpuUsage(deviceName),
      getDeviceMemoryUsage(deviceName),
    ]);

    return { cpuUsage: cpuUsage.currentCpuUsage.usage, memoryUsage: memoryUsage.currentMemoryUsage.usage };
  }

  async function getDeviceLoadUsages(deviceNames: string[]): Promise<(DeviceLoadUsage & { deviceName: string })[]> {
    const [cpuUsages, memoryUsages] = await Promise.all([
      getDeviceCpuUsages(deviceNames),
      getDeviceMemoryUsages(deviceNames),
    ]);

    const map = new Map<string, DeviceLoadUsage & { deviceName: string }>();

    cpuUsages.currentCpuUsages?.forEach((cpuUsage) => {
      map.set(cpuUsage.device, { deviceName: cpuUsage.device, cpuUsage: cpuUsage.usage, memoryUsage: null });
    });

    memoryUsages.currentMemoryUsages?.forEach((memoryUsage) => {
      const deviceLoadUsage = map.get(memoryUsage.device);
      if (deviceLoadUsage) {
        deviceLoadUsage.memoryUsage = memoryUsage.usage;
      } else {
        map.set(memoryUsage.device, { deviceName: memoryUsage.device, cpuUsage: null, memoryUsage: memoryUsage.usage });
      }
    });

    return Array.from(map.values());
  }

  return { getDeviceLoadUsage, getDeviceLoadUsages };
}

export type PerformanceMonitoringAPI = ReturnType<typeof getPerformanceMonitoringAPI>;
export default getPerformanceMonitoringAPI;
