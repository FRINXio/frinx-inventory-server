import { sendGetRequest } from './helpers';
import { decodeScheduleListOutput, decodeScheduleOutput } from './scheduler-network-types';

async function listSchedules(baseURL: string): Promise<unknown> {
  const json = await sendGetRequest([baseURL, 'schedule']);
  const data = decodeScheduleListOutput(json);

  return data;
}

async function getSchedule(baseURL: string, workflowName: string, workflowVersion: number): Promise<unknown> {
  const json = await sendGetRequest([baseURL, `schedule/${workflowName}:${workflowVersion}`]);
  const data = decodeScheduleOutput(json);

  return data;
}

const schedulerAPI = {
  listSchedules,
  getSchedule,
};

export type SchedulerAPI = typeof schedulerAPI;
export default schedulerAPI;
