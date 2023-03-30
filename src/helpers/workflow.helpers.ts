import { Workflow } from '../schema/source-types';
import { SearchQuery, PaginationArgs } from '../types/conductor.types';

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
