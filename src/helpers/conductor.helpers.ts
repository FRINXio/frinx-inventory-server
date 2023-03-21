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
  freeText?: string | null;
  rootWf?: boolean | null;
  query?: ConductorQuery | null;
};

export type PaginationArgs = {
  size?: number | null;
  start?: number | null;
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

function formatRootWfToString(rootWf: boolean): string {
  if (rootWf) {
    return 'freeText=root_wf';
  }

  return '';
}

function formatFreeTextToString(freeText?: string | null): string {
  if (freeText && freeText.trim().length > 0) {
    return freeText;
  }

  return '*';
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
    const { freeText, rootWf, query } = searchQuery;

    if (rootWf) {
      result.push(formatRootWfToString(rootWf));
    }

    if (query) {
      result.push(`query=${formatQueryToString(query)}`);
    }

    result.push(`freeText=${formatFreeTextToString(freeText)}`);
  }

  if (paginationArgs) {
    result.push(formatPaginationArgsToString(paginationArgs));
  }

  return result.join('&');
}
