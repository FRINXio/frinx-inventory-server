import { v4 as uuid } from 'uuid';
import { connectionFromArray } from 'graphql-relay';
import { ExecutedWorkflow, ExecutedWorkflowTask, Workflow } from '../schema/source-types';
import { SearchQuery, PaginationArgs } from '../types/conductor.types';
import { NestedTask, decodeWorkflowTaskInput } from '../external-api/conductor-network-types';
import conductorAPI, { SubWorkflowInputData } from '../external-api/conductor';
import { omitNullValue, unwrap } from './utils.helpers';
import config from '../config';
import { toGraphId } from './id-helper';
import { ScheduleListOutput } from '../external-api/scheduler-network-types';

type GraphQLSearchQuery = {
  isRootWorkflow?: boolean | null;
  query?: {
    freeText?: string | null;
    startTime?: {
      from: string;
      to?: string | null;
    } | null;
    workflowId?: string[] | null;
    workflowType?: string[] | null;
  } | null;
};

type ScheduleListPaginationArgs = {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
};

export function makeSearchQueryFromArgs(searchQuery?: GraphQLSearchQuery | null): SearchQuery {
  return {
    ...searchQuery,
    query: {
      ...searchQuery?.query,
      startTime: searchQuery?.query?.startTime
        ? {
            from: Date.parse(searchQuery.query.startTime.from),
            to: searchQuery.query.startTime.to ? Date.parse(searchQuery.query.startTime.to) : undefined,
          }
        : undefined,
    },
  };
}

export function makePaginationFromArgs(pagination?: PaginationArgs | null) {
  return pagination != null
    ? {
        size: pagination.size + 1,
        start: pagination.start,
      }
    : null;
}

export function jsonParse<T = { description: string }>(json?: string | null): T | null {
  if (json == null) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

type WorkflowFilter = {
  keyword?: string | null;
  labels?: string[] | null;
};

type DescriptionJSON = { labels?: string[]; description: string };
type WorkflowWithoutId = Omit<Workflow, 'id'>;

export function getFilteredWorkflows(workflows: WorkflowWithoutId[], filter: WorkflowFilter): WorkflowWithoutId[] {
  const filteredWorkflows = workflows
    .map((w) => ({
      ...w,
      parsedDescription: jsonParse<DescriptionJSON>(w.description ?? ''),
    }))
    // labels filter = true if all filter labels are present in description labels
    .filter((w) => filter?.labels?.every((f) => w.parsedDescription?.labels?.includes(f)) ?? true)
    // keyword filter = true if keyword filter is substring of workflow
    .filter((w) => (filter.keyword ? w.name.toLowerCase().includes(filter.keyword.toLowerCase()) : true));

  return filteredWorkflows;
}

export function validateTasks(tasks: string): NestedTask[] {
  try {
    const json = JSON.parse(tasks);
    const output = decodeWorkflowTaskInput(json);
    return output;
  } catch (e) {
    throw new Error('tasks validation error');
  }
}

type SubWorkflow = {
  name: string;
  version: number;
  referenceTaskName: string;
  subWorkflowId: string;
};

function extractSubworkflowsFromTasks(task: ExecutedWorkflowTask): SubWorkflow | null {
  if (task && task.taskType === 'SUB_WORKFLOW' && task.inputData) {
    const { subWorkflowName, subWorkflowVersion } = task.inputData as SubWorkflowInputData;

    if (subWorkflowName) {
      return {
        name: subWorkflowName,
        version: subWorkflowVersion,
        referenceTaskName: unwrap(task.referenceTaskName),
        subWorkflowId: unwrap(task.subWorkflowId),
      };
    }
  }
  return null;
}

type SubworkflowDetail = {
  taskReferenceName: string;
  workflowDetail: Workflow;
  executedWorkflowDetail: ExecutedWorkflow;
};

async function getSubworklowsDetail(subWorkflow: SubWorkflow): Promise<SubworkflowDetail> {
  const { name, version, referenceTaskName, subWorkflowId } = subWorkflow;
  const workflowDetailPromise = conductorAPI.getWorkflowDetail(config.conductorApiURL, name, version);
  const executedWorkflowDetailPromise = conductorAPI.getExecutedWorkflowDetail(config.conductorApiURL, subWorkflowId);
  const [workflowDetail, executedWorkflowDetail] = await Promise.all([
    workflowDetailPromise,
    executedWorkflowDetailPromise,
  ]);

  const workflowDetailWithId = {
    ...workflowDetail,
    id: uuid(),
  };

  const executedWorkflowDetailWithId = {
    ...executedWorkflowDetail,
    id: uuid(),
  };

  return {
    taskReferenceName: referenceTaskName,
    workflowDetail: workflowDetailWithId,
    executedWorkflowDetail: executedWorkflowDetailWithId,
  };
}

export async function getSubworkflows(workflow: ExecutedWorkflow) {
  if (!workflow.tasks) {
    return [];
  }

  const promises = workflow.tasks
    .map((t) => ({ ...t, id: toGraphId('ExecutedWorkflowTask', unwrap(t.taskId || null)) }))
    .map(extractSubworkflowsFromTasks)
    .filter(omitNullValue)
    .map(getSubworklowsDetail);

  const subWorkflows = await Promise.all(promises);
  return subWorkflows;
}

export function makeConnectionFromScheduleList(schedules: ScheduleListOutput, args: ScheduleListPaginationArgs) {
  return {
    ...connectionFromArray(
      schedules.map((schedule) => ({
        ...schedule,
        workflowContext: JSON.stringify(schedule.workflowContext),
        taskToDomain: JSON.stringify(schedule.taskToDomain),
        enabled: schedule.enabled || null,
        fromDate: schedule.fromDate || null,
        toDate: schedule.toDate || null,
        parallelRuns: schedule.parallelRuns || null,
        correlationId: schedule.correlationId || null,
      })),
      args,
    ),
    totalCount: schedules.length,
  };
}
