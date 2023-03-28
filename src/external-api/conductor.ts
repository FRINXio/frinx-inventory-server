import getLogger from '../get-logger';
import { makeStringQueryFromSearchQueryObject, PaginationArgs, SearchQuery } from '../helpers/conductor.helpers';
import { StartWorkflowInput } from '../types/conductor.types';
import {
  BulkOperationOutput,
  ApiExecutedWorkflow,
  decodeBulkOperationOutput,
  decodeExecutedWorkflowDetailOutput,
  decodeExecutedWorkflowsOutput,
  decodeWorkflowDetailOutput,
  decodeWorkflowEditOutput,
  decodeWorkflowMetadataOutput,
  WorkflowMetadataOutput,
  WorkflowDetailInput,
  ExecutedWorkflowsOutput,
  WorkflowDetailOutput,
  WorkflowEditOutput,
} from './conductor-network-types';
import { sendDeleteRequest, sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';

export const log = getLogger('frinx-graphql-conductor');

async function getWorkflowMetadata(baseURL: string): Promise<WorkflowMetadataOutput> {
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

async function editWorkflow(baseURL: string, workflow: WorkflowDetailInput): Promise<WorkflowEditOutput> {
  const json = await sendPutRequest([baseURL, 'metadata/workflow'], [workflow]);
  const data = decodeWorkflowEditOutput(json);
  return data;
}

async function deleteWorkflow(baseURL: string, name: string, version: number): Promise<void> {
  await sendDeleteRequest([baseURL, `metadata/workflow/${name}/${version}`]);
}

async function pauseWorkflow(baseURL: string, workflowId: string): Promise<string> {
  try {
    await sendPutRequest([baseURL, `workflow/${workflowId}/pause`]);

    return 'Workflow successfully paused';
  } catch (error) {
    throw new Error("Workflow couldn't be paused");
  }
}

async function resumeWorkflow(baseURL: string, workflowId: string): Promise<string> {
  try {
    await sendPutRequest([baseURL, `workflow/${workflowId}/resume`]);

    return 'Workflow successfully resumed';
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
    const executedWorkflowId = await sendPostRequest([baseURL, 'workflow'], input);

    if (executedWorkflowId != null && typeof executedWorkflowId === 'string') {
      return executedWorkflowId;
    } else {
      throw new Error('We could not execute the workflow');
    }
  } catch (error) {
    log.error(`Execute New Workflow Error: ${error}`);
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
    const executedWorkflowId = await sendPostRequest(
      [baseURL, `workflow/${name}?version=${version}&correlationId=${correlationId}&priority=${priority}`],
      inputParameters,
    );

    if (executedWorkflowId != null && typeof executedWorkflowId === 'string') {
      return executedWorkflowId;
    } else {
      throw new Error('We could not execute the workflow');
    }
  } catch (error) {
    log.error(`Execute Workflow By Name Error: ${error}`);
    throw new Error('We could not execute the workflow');
  }
}

const conductorAPI = {
  getWorkflowMetadata,
  getWorkflowDetail,
  createWorkflow,
  editWorkflow,
  deleteWorkflow,
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
