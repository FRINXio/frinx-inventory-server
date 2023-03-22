import {
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  WorfklowMetadataOutput,
  WorkflowDetailInput,
  WorkflowDetailOutput,
} from './conductor-network-types';
import { sendDeleteRequest, sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';

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

async function createWorkflow(baseURL: string, workflow: WorkflowDetailInput): Promise<void> {
  await sendPostRequest([baseURL, 'metadata/workflow'], workflow);
}

async function editWorkflow(baseURL: string, workflow: WorkflowDetailInput): Promise<void> {
  await sendPutRequest([baseURL, 'metadata/workflow'], [workflow]);
}

async function deleteWorkflow(baseURL: string, name: string, version: number): Promise<void> {
  await sendDeleteRequest([baseURL, `metadata/workflow/${name}/${version}`]);
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
  createWorkflow,
  editWorkflow,
  deleteWorkflow,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
