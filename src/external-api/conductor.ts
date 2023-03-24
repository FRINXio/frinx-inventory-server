import { makeStringQueryFromSearchQueryObject, PaginationArgs, SearchQuery } from '../helpers/conductor.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import {
  ApiExecutedWorkflow,
  decodeExecutedWorkflowDetailOutput,
  decodeExecutedWorkflowsOutput,
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  ExecutedWorkflowsOutput,
  WorfklowMetadataOutput,
  WorkflowDetailOutput,
} from './conductor-network-types';
import { sendGetRequest, sendPostRequest } from './helpers';

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
  const formattedQuery = makeStringQueryFromSearchQueryObject(query, paginationArgs);
  const json = await sendGetRequest([baseURL, `workflow/search-v2?${formattedQuery}`]);
  const data = decodeExecutedWorkflowsOutput(json);

  return data;
}

async function getExecutedWorkflowDetail(baseURL: string, workflowId: string): Promise<ApiExecutedWorkflow> {
  const json = await sendGetRequest([baseURL, `workflow/${workflowId}`]);
  const data = decodeExecutedWorkflowDetailOutput(json);

  return data;
}

async function executeNewWorkflow(baseURL: string, inputPayload: StartWorkflowInput): Promise<string> {
  try {
    const json = await sendPostRequest([baseURL, 'workflow'], inputPayload);

    if (json != null && typeof json === 'string') {
      return json;
    } else {
      throw new Error('We could not execute the workflow');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    throw new Error('We could not execute the workflow');
  }
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
  getExecutedWorkflows,
  getExecutedWorkflowDetail,
  executeNewWorkflow,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
