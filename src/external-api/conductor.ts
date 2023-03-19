import {
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  WorfklowMetadataOutput,
  WorkflowDetailOutput,
} from './conductor-network-types';
import { sendGetRequest } from './helpers';

async function getWorkflowMetadata(baseURL: string): Promise<WorfklowMetadataOutput> {
  const json = await sendGetRequest([baseURL, 'metadata/workflow']);
  const data = decodeWorkflowMetadataOutput(json);
  return data;
}

async function getWorkflowDetail(baseURL: string, workflowName: string): Promise<WorkflowDetailOutput> {
  const json = await sendGetRequest([baseURL, `metadata/workflow/${workflowName}`]);
  const data = decodeWorkflowDetailOutput(json);
  return data;
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
