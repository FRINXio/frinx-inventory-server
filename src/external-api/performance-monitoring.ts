export type DeviceLoadUsage = {
  cpuUsage: number;
  memoryUsage: number;
};

async function getDeviceCpuUsage(deviceName: string): Promise<number> {
  return Math.random() * 100;
}

async function getDeviceMemoryUsage(deviceName: string): Promise<number> {
  return Math.random() * 100;
}

function getPerformanceMonitoringAPI() {
  async function getDeviceLoadUsage(deviceName: string): Promise<DeviceLoadUsage> {
    const [cpuUsage, memoryUsage] = await Promise.all([
      getDeviceCpuUsage(deviceName),
      getDeviceMemoryUsage(deviceName),
    ]);

    return { cpuUsage, memoryUsage };
  }

  return { getDeviceLoadUsage };
}

export type PerformanceMonitoringAPI = ReturnType<typeof getPerformanceMonitoringAPI>;
export default getPerformanceMonitoringAPI;
