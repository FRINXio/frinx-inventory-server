import { gql, GraphQLClient } from 'graphql-request';
import config from '../config';
import {
  BulkDeviceMetricsQuery,
  BulkDeviceMetricsQueryVariables,
  DeviceMetricsQuery,
  DeviceMetricsQueryVariables,
} from '../__generated__/perf-monitoring.graphql';

export type DeviceLoadUsage = {
  cpuUsage: number | null;
  memoryUsage: number | null;
};

export type NodesConnectionStatus = {
  status: 'complete' | 'fail';
};

const BULK_DEVICE_METRICS = gql`
  query BulkDeviceMetrics($devices: [String!]!) {
    bulkCurrentUtilization(devices: $devices) {
      device
      deviceMetrics {
        cpu
        memory
      }
    }
  }
`;

const DEVICE_METRICS = gql`
  query DeviceMetrics($device: String!) {
    currentUtilization(device: $device) {
      device
      deviceMetrics {
        cpu
        memory
      }
    }
  }
`;

function getPerformanceMonitoringAPI() {
  if (config.performanceMonitoringEnabled === false) {
    if (config.topologyEnabled === false) {
      return undefined;
    }
  }
  if (!config.performanceMonitoringGraphqlURL) {
    return undefined;
  }
  const client = new GraphQLClient(config.performanceMonitoringGraphqlURL);

  async function getDeviceMetrics(deviceName: string): Promise<DeviceMetricsQuery> {
    const result = await client.request<DeviceMetricsQuery, DeviceMetricsQueryVariables>(DEVICE_METRICS, {
      device: deviceName,
    });

    return result;
  }

  async function getBulkDeviceMetrics(deviceNames: string[]): Promise<BulkDeviceMetricsQuery> {
    const result = await client.request<BulkDeviceMetricsQuery, BulkDeviceMetricsQueryVariables>(BULK_DEVICE_METRICS, {
      devices: deviceNames,
    });

    return result;
  }

  async function getDeviceLoadUsage(deviceName: string): Promise<DeviceLoadUsage> {
    const { currentUtilization } = await getDeviceMetrics(deviceName);

    return { cpuUsage: currentUtilization.deviceMetrics.cpu, memoryUsage: currentUtilization.deviceMetrics.memory };
  }

  async function getDeviceLoadUsages(deviceNames: string[]): Promise<(DeviceLoadUsage & { deviceName: string })[]> {
    const { bulkCurrentUtilization } = await getBulkDeviceMetrics(deviceNames);
    return bulkCurrentUtilization.map((u) => ({
      deviceName: u.device,
      cpuUsage: u.deviceMetrics.cpu,
      memoryUsage: u.deviceMetrics.memory,
    }));
  }

  return { getDeviceLoadUsage, getDeviceLoadUsages };
}
export type PerformanceMonitoringAPI = ReturnType<typeof getPerformanceMonitoringAPI>;
export default getPerformanceMonitoringAPI;
