import { isValidType } from './utils.helpers';

export type ExecutedWorkflowResult = {
  results: unknown[];
  totalHits: number;
};

export type ConductorQuerySearchTime = {
  from: number;
  to?: number | null;
};

export type ConductorQueryStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TERMINATED' | 'TIMED_OUT' | 'PAUSED';

export type ConductorQuery = {
  status?: ConductorQueryStatus[] | null;
  startTime?: ConductorQuerySearchTime | null;
  workflowId?: string[] | null;
  workflowType?: string[] | null;
};

export type SearchQuery = {
  isRootWorkflow?: boolean | null;
  query?: ConductorQuery | null;
};

export type PaginationArgs = {
  size: number;
  start: number;
};

export function makeStringQueryFromSearchTime(searchTime: ConductorQuerySearchTime): string {
  const { from, to } = searchTime;

  if (from != null && to != null) {
    return `startTime > ${from} AND startTime < ${to}`;
  } else {
    return `startTime > ${from}`;
  }
}

export function makeStringFromQuery(query: ConductorQuery): string {
  const entries = Object.entries(query);

  return entries
    .map(([key, value]) => {
      if (value == null) {
        return '';
      } else {
        if (Array.isArray(value)) {
          if (value.every((v) => typeof v === 'string')) {
            return `${key} IN (${value.map((v) => `${v}`).join(',')})`;
          }
        }

        if (isValidType<ConductorQuerySearchTime>('from', value)) {
          return makeStringQueryFromSearchTime(value);
        }

        return `${key}=${value}`;
      }
    })
    .join(' AND ');
}

export function makeStringFromIsRootWorkflow(isRootWorkflow?: boolean | null): string {
  if (isRootWorkflow) {
    return 'freeText=root_wf';
  }

  return 'freeText=*';
}

export function makeStringFromPagination(paginationArgs: PaginationArgs): string {
  const { size, start } = paginationArgs;

  return `size=${size ?? 100}&start=${start ?? 0}`;
}

export function makeStringQueryFromSearchQueryObject(
  searchQuery?: SearchQuery | null,
  paginationArgs?: PaginationArgs | null,
): string {
  const result = [];

  if (searchQuery) {
    const { isRootWorkflow, query } = searchQuery;

    if (query) {
      result.push(`query=${makeStringFromQuery(query)}`);
    }

    result.push(makeStringFromIsRootWorkflow(isRootWorkflow));
  } else {
    result.push('freeText=*');
  }

  if (paginationArgs) {
    result.push(makeStringFromPagination(paginationArgs));
  }

  return result.join('&');
}
