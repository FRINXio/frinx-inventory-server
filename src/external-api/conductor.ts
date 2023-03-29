import { makeStringQueryFromSearchQueryObject, PaginationArgs, SearchQuery } from '../helpers/conductor.helpers';
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

async function retryWorkflow(
  baseURL: string,
  workflowId: string,
  resumeSubworkflowTasks: boolean | null = true,
): Promise<string> {
  try {
    await sendPostRequest([baseURL, `workflow/${workflowId}/retry?resumeSubworkflowTasks=${resumeSubworkflowTasks}`]);

    return 'Workflow successfully retried';
  } catch (error) {
    throw new Error("Workflow couldn't be retried");
  }
}

async function restartWorkflow(
  baseURL: string,
  workflowId: string,
  useLatestDefinitions: boolean | null = true,
): Promise<string> {
  try {
    const json = await sendPostRequest([
      baseURL,
      `workflow/${workflowId}/restart?useLatestDefinitions=${useLatestDefinitions}`,
    ]);

    return String(json);
  } catch (error) {
    throw new Error("Workflow couldn't be restarted");
  }
}

async function terminateWorkflow(baseURL: string, workflowId: string, reason?: string | null): Promise<string> {
  try {
    if (reason) {
      await sendDeleteRequest([baseURL, `workflow/${workflowId}?reason=${reason}`]);
    } else {
      await sendDeleteRequest([baseURL, `workflow/${workflowId}`]);
    }

    return 'Workflow successfully terminated';
  } catch (error) {
    throw new Error("Workflow couldn't be terminated");
  }
}

async function removeWorkflow(
  baseURL: string,
  workflowId: string,
  archiveWorkflow: boolean | null = true,
): Promise<string> {
  try {
    await sendDeleteRequest([baseURL, `workflow/${workflowId}/remove?archiveWorkflow=${archiveWorkflow}`]);

    return 'Workflow successfully removed';
  } catch (error) {
    throw new Error("Workflow couldn't be removed");
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
  retryWorkflow,
  restartWorkflow,
  terminateWorkflow,
  removeWorkflow,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
