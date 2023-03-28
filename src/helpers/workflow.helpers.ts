import { PaginationArgs, SearchQuery } from './conductor.helpers';

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
