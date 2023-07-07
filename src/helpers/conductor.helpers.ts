import { ConductorQuerySearchTime, ConductorQuery, PaginationArgs, SearchQuery } from '../types/conductor.types';
import { isValidType } from './utils.helpers';
import { TaskDefinitionDetailInput } from '../external-api/conductor-network-types';

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

export type AsyncGeneratorHookParams<T> = {
  fn: (abortController: AbortController) => () => Promise<T | null>;
  repeatTill: (data?: T | null) => boolean;
  timeout?: number;
  updateDeps?: unknown[];
};

export type AsyncGeneratorParams<T> = {
  fn: () => Promise<T | null>;
  repeatTill: (data?: T | null) => boolean;
  timeout?: number;
};

export async function* asyncGenerator<T>({
  fn,
  repeatTill,
  timeout = 800,
}: AsyncGeneratorParams<T>): AsyncGenerator<T | null, void, unknown> {
  let data = await fn();
  const controller = new AbortController();

  while (repeatTill(data)) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
    yield data;
    // eslint-disable-next-line no-await-in-loop
    data = await fn();
  }
  // we need to do an additional yield for the last task status change
  yield data;
  controller.abort();
}
