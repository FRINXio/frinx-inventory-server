import {
  decodeExecutedWorkflowOutput,
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  ExecutedWorkflowOutput,
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

export type SearchQuery = {
  freeText?: string;
  rootWf?: boolean;
  query?: string;
};

export type PaginationArgs = {
  first?: number;
  last?: number;
  before?: string;
  after?: string;
};

async function getExecutedWorkflows(baseURL: string, query: SearchQuery): Promise<ExecutedWorkflowOutput> {
  const formattedQuery = Object.entries(query)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const json = await sendGetRequest([baseURL, `workflow/search-v2?${formattedQuery}`]);
  const data = decodeExecutedWorkflowOutput(json as { results: unknown[]; totalHits: number });

  return data;
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
  getExecutedWorkflows,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
