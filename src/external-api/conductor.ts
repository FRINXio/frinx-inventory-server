import { makeStringQueryFromSearchQueryObject, PaginationArgs, SearchQuery } from '../helpers/conductor.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import {
  BulkOperationOutput,
  decodeBulkOperationOutput,
  ApiExecutedWorkflow,
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  WorfklowMetadataOutput,
  WorkflowDetailOutput,
  decodeExecutedWorkflowDetailOutput,
  decodeExecutedWorkflowsOutput,
  ExecutedWorkflowsOutput,
} from './conductor-network-types';
import { sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';

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

async function pauseWorkflow(baseURL: string, workflowId: string): Promise<string> {
  try {
    const json = await sendPutRequest([baseURL, `workflow/${workflowId}/pause`]);

    return String(json);
  } catch (error) {
    throw new Error("Workflow couldn't be paused");
  }
}

async function resumeWorkflow(baseURL: string, workflowId: string): Promise<string> {
  try {
    const json = await sendPutRequest([baseURL, `workflow/${workflowId}/resume`]);

    return String(json);
  } catch (error) {
    throw new Error("Workflow couldn't be resumed");
  }
}

async function bulkResumeWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  try {
    const json = await sendPutRequest([baseURL, `workflow/bulk/resume`], workflowIds);
    const data = decodeBulkOperationOutput(json);

    return data;
  } catch (error) {
    throw new Error('Bulk resume of workflows was not successful');
  }
}

async function bulkPauseWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  try {
    const json = await sendPutRequest([baseURL, `workflow/bulk/pause`], workflowIds);
    const data = decodeBulkOperationOutput(json);

    return data;
  } catch (error) {
    throw new Error('Bulk pause of workflows was not successful');
  }
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

async function executeNewWorkflow(baseURL: string, input: StartWorkflowInput): Promise<string> {
  try {
    const json = await sendPostRequest([baseURL, 'workflow'], input);

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

type ExecuteWorkflowByNameInput = {
  name: string;
  inputParameters: Record<string, unknown>;
  correlationId?: string | null;
  version?: number | null;
  priority?: number | null;
};

async function executeWorkflowByName(
  baseURL: string,
  { name, inputParameters, correlationId, version, priority }: ExecuteWorkflowByNameInput,
): Promise<string> {
  try {
    const json = await sendPostRequest(
      [baseURL, `workflow/${name}?version=${version}&correlationId=${correlationId}&priority=${priority}`],
      inputParameters,
    );

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
  pauseWorkflow,
  resumeWorkflow,
  bulkResumeWorkflow,
  bulkPauseWorkflow,
  getExecutedWorkflows,
  getExecutedWorkflowDetail,
  executeNewWorkflow,
  executeWorkflowByName,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
