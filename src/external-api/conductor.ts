import { formatSearchQueryToString, PaginationArgs, SearchQuery } from '../helpers/conductor.helpers';
import {
  decodeExecutedWorkflowDetailOutput,
  decodeExecutedWorkflowOutput,
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  ExecutedWorkflowDetailOutput,
  ExecutedWorkflowsOutput,
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

async function getExecutedWorkflows(
  baseURL: string,
  query?: SearchQuery | null,
  paginationArgs?: PaginationArgs | null,
): Promise<ExecutedWorkflowsOutput> {
  const formattedQuery = formatSearchQueryToString(query, paginationArgs);
  const json = await sendGetRequest([baseURL, `workflow/search-v2?${formattedQuery}`]);
  const data = decodeExecutedWorkflowOutput(json as { results: ExecutedWorkflowsOutput });

  return data;
}

async function getExecutedWorkflowDetail(baseURL: string, workflowId: string): Promise<ExecutedWorkflowDetailOutput> {
  const json = await sendGetRequest([baseURL, `workflow/${workflowId}`]);
  const data = decodeExecutedWorkflowDetailOutput(json as { results: ExecutedWorkflowDetailOutput });

  return data;
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
  getExecutedWorkflows,
  getExecutedWorkflowDetail,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
