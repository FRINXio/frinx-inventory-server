import { makeStringQueryFromSearchQueryObject } from '../helpers/conductor.helpers';
import { PaginationArgs, SearchQuery, StartWorkflowInput } from '../types/conductor.types';
import {
  BulkOperationOutput,
  ApiExecutedWorkflow,
  decodeBulkOperationOutput,
  decodeExecutedWorkflowDetailOutput,
  decodeExecutedWorkflowsOutput,
  decodeWorkflowDetailOutput,
  decodeWorkflowMetadataOutput,
  WorkflowMetadataOutput,
  WorkflowDetailInput,
  ExecutedWorkflowsOutput,
  WorkflowDetailOutput,
  TaskDefinitionsOutput,
  decodeTaskDefinitionsOutput,
  decodeBulkTerminateOutput,
  decodeExecutedWorkflowTaskDetailOutput,
  ApiExecutedWorkflowTask,
} from './conductor-network-types';
import { sendDeleteRequest, sendGetRequest, sendPostRequest, sendPutRequest } from './helpers';

async function getWorkflowMetadata(baseURL: string): Promise<WorkflowMetadataOutput> {
  const json = await sendGetRequest([baseURL, 'metadata/workflow']);
  const data = decodeWorkflowMetadataOutput(json);
  return data;
}

// this type is annotated based on real request data (it is no annotated in swagger)
export type SubWorkflowInputData = {
  subWorkflowDefinition: WorkflowDetailOutput | null;
  workflowInput: Record<string, unknown>;
  subWorkflowTaskToDomain: unknown | null;
  subWorkflowName: string;
  subWorkflowVersion: number;
};

async function getWorkflowDetail(
  baseURL: string,
  workflowName: string,
  version?: number,
): Promise<WorkflowDetailOutput> {
  const query = version ? `?version=${version}` : '';
  const json = await sendGetRequest([baseURL, `metadata/workflow/${workflowName}${query}`]);
  const data = decodeWorkflowDetailOutput(json);
  return data;
}

async function createWorkflow(baseURL: string, workflow: WorkflowDetailInput): Promise<void> {
  await sendPostRequest([baseURL, 'metadata/workflow'], workflow);
}

async function editWorkflow(baseURL: string, workflow: WorkflowDetailInput): Promise<BulkOperationOutput> {
  const json = await sendPutRequest([baseURL, 'metadata/workflow'], [workflow]);
  const data = decodeBulkOperationOutput(json);
  return data;
}

async function deleteWorkflow(baseURL: string, name: string, version: number): Promise<void> {
  await sendDeleteRequest([baseURL, `metadata/workflow/${name}/${version}`]);
}

async function pauseWorkflow(baseURL: string, workflowId: string): Promise<void> {
  await sendPutRequest([baseURL, `workflow/${workflowId}/pause`]);
}

async function resumeWorkflow(baseURL: string, workflowId: string): Promise<void> {
  await sendPutRequest([baseURL, `workflow/${workflowId}/resume`]);
}

async function bulkResumeWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  const json = await sendPutRequest([baseURL, `workflow/bulk/resume`], workflowIds);
  const data = decodeBulkOperationOutput(json);

  return data;
}

async function bulkPauseWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  const json = await sendPutRequest([baseURL, `workflow/bulk/pause`], workflowIds);
  const data = decodeBulkOperationOutput(json);

  return data;
}

async function bulkTerminateWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  const json = await sendPostRequest([baseURL, `workflow/bulk/terminate`], workflowIds);
  const data = decodeBulkTerminateOutput(json);
  return data;
}

async function bulkRetryWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  const json = await sendPostRequest([baseURL, `workflow/bulk/retry`], workflowIds);
  const data = decodeBulkTerminateOutput(json);
  return data;
}

async function bulkRestartWorkflow(baseURL: string, workflowIds: string[]): Promise<BulkOperationOutput> {
  const json = await sendPostRequest([baseURL, `workflow/bulk/restart`], workflowIds);
  const data = decodeBulkTerminateOutput(json);
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

async function getExecutedWorkflowDetail(
  baseURL: string,
  workflowId: string,
  shouldIncludeTasks?: boolean,
): Promise<ApiExecutedWorkflow> {
  const query = shouldIncludeTasks === false ? '?includeTasks=false' : '';
  const json = await sendGetRequest([baseURL, `workflow/${workflowId}${query}`]);
  const data = decodeExecutedWorkflowDetailOutput(json);

  return data;
}

async function retryWorkflow(
  baseURL: string,
  workflowId: string,
  shouldResumeSubworkflowTasks: boolean | null = true,
): Promise<void> {
  await sendPostRequest([
    baseURL,
    `workflow/${workflowId}/retry?resumeSubworkflowTasks=${shouldResumeSubworkflowTasks}`,
  ]);
}

async function restartWorkflow(
  baseURL: string,
  workflowId: string,
  shouldUseLatestDefinitions: boolean | null = true,
): Promise<void> {
  await sendPostRequest([baseURL, `workflow/${workflowId}/restart?useLatestDefinitions=${shouldUseLatestDefinitions}`]);
}

async function terminateWorkflow(baseURL: string, workflowId: string, reason?: string | null): Promise<void> {
  if (reason) {
    await sendDeleteRequest([baseURL, `workflow/${workflowId}?reason=${reason}`]);
  } else {
    await sendDeleteRequest([baseURL, `workflow/${workflowId}`]);
  }
}

async function removeWorkflow(
  baseURL: string,
  workflowId: string,
  shouldArchiveWorkflow: boolean | null = true,
): Promise<void> {
  await sendDeleteRequest([baseURL, `workflow/${workflowId}/remove?archiveWorkflow=${shouldArchiveWorkflow}`]);
}

async function executeNewWorkflow(baseURL: string, input: StartWorkflowInput): Promise<string> {
  const executedWorkflowId = await sendPostRequest([baseURL, 'workflow'], input);

  if (executedWorkflowId != null && typeof executedWorkflowId === 'string') {
    return executedWorkflowId;
  } else {
    throw new Error('We could not execute the workflow');
  }
}

type ExecuteWorkflowByNameInput = {
  name: string;
  inputParameters: Record<string, unknown>;
  correlationId?: string | null;
  version?: string | null;
  priority?: number | null;
};

async function executeWorkflowByName(
  baseURL: string,
  { name, inputParameters, correlationId, version, priority }: ExecuteWorkflowByNameInput,
): Promise<string> {
  const executedWorkflowId = await sendPostRequest(
    [
      baseURL,
      `workflow/${name}?${version == null ? '' : `version=${version}`}${
        correlationId == null ? '' : `&correlationId=${correlationId}`
      }&priority=${priority}`,
    ],
    inputParameters,
  );

  if (executedWorkflowId != null && typeof executedWorkflowId === 'string') {
    return executedWorkflowId;
  } else {
    throw new Error('We could not execute the workflow');
  }
}

async function getTaskDefinitions(baseURL: string): Promise<TaskDefinitionsOutput> {
  const json = await sendGetRequest([baseURL, 'metadata/taskdefs']);
  const data = decodeTaskDefinitionsOutput(json);
  return data;
}

async function getExecutedWorkflowTaskDetail(baseURL: string, taskId: string): Promise<ApiExecutedWorkflowTask> {
  const json = await sendGetRequest([baseURL, `/tasks/${taskId}`]);
  const data = decodeExecutedWorkflowTaskDetailOutput(json);
  return data;
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
  bulkTerminateWorkflow,
  bulkRetryWorkflow,
  bulkRestartWorkflow,
  getExecutedWorkflows,
  getExecutedWorkflowDetail,
  retryWorkflow,
  restartWorkflow,
  terminateWorkflow,
  removeWorkflow,
  executeNewWorkflow,
  executeWorkflowByName,
  getTaskDefinitions,
  getExecutedWorkflowTaskDetail,
};

export type ConductorAPI = typeof conductorAPI;
export default conductorAPI;
