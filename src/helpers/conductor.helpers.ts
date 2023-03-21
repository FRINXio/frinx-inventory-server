export type ExecutedWorkflowResult = {
  results: unknown[];
  totalHits: number;
};

type ConductorQuery = {
  status?: ('RUNNING' | 'COMPLETED' | 'FAILED' | 'TERMINATED' | 'TIMED_OUT' | 'PAUSED')[] | null;
  startTime?: {
    from: number;
    to?: number | null;
  } | null;
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

function formatQueryToString(query: ConductorQuery): string {
  const entries = Object.entries(query);

  return entries
    .map(([key, value]) => {
      if (value == null) {
        return '';
      } else {
        if (Array.isArray(value)) {
          if (typeof value[0] === 'string') {
            return `${key} IN (${value.map((v) => `${v}`).join(',')})`;
          }
        }

        if (typeof value === 'object' && key === 'startTime') {
          const { from, to } = value as { from?: number | null; to?: number | null };

          if (from != null && to != null) {
            return `${key} > ${from} AND ${key} < ${to}`;
          }

          if (from != null) {
            return `${key} > ${from}`;
          }

          if (to != null) {
            return `${key} > ${Date.now()} AND ${key} < ${to}`;
          }

          return '';
        }

        return `${key}=${value}`;
      }
    })
    .join(' AND ');
}

function formatRootWfToString(isRootWorkflow: boolean): string {
  if (isRootWorkflow) {
    return 'freeText=root_wf';
  }

  return '';
}

function formatPaginationArgsToString(paginationArgs: PaginationArgs): string {
  const { size, start } = paginationArgs;

  return `size=${size ?? 100}&start=${start ?? 0}`;
}

export function formatSearchQueryToString(
  searchQuery?: SearchQuery | null,
  paginationArgs?: PaginationArgs | null,
): string {
  const result = [];

  if (searchQuery) {
    const { isRootWorkflow, query } = searchQuery;

    if (isRootWorkflow) {
      result.push(formatRootWfToString(isRootWorkflow));
    }

    if (query) {
      result.push(`query=${formatQueryToString(query)}`);
    }
  }

  if (paginationArgs) {
    result.push(formatPaginationArgsToString(paginationArgs));
  }

  result.push('freeText=*');

  return result.join('&');
}
