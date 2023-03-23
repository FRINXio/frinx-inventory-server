import {
  ConductorQuery,
  ConductorQuerySearchTime,
  PaginationArgs,
  SearchQuery,
  makeStringFromIsRootWorkflow,
  makeStringFromPagination,
  makeStringFromQuery,
  makeStringQueryFromSearchQueryObject,
  makeStringQueryFromSearchTime,
} from './conductor.helpers';

/* eslint-env jest */
test('Make string from Search Time Conductor Query Object', () => {
  const searchTime: ConductorQuerySearchTime = {
    from: 123,
    to: 456,
  };
  const result = makeStringQueryFromSearchTime(searchTime);
  expect(result).toBe('startTime > 123 AND startTime < 456');
});

test('Make string from Search Time Conductor Query Object with only from', () => {
  const searchTime: ConductorQuerySearchTime = {
    from: 123,
  };
  const result = makeStringQueryFromSearchTime(searchTime);
  expect(result).toBe('startTime > 123');
});

test('Make string from isRootWorkflow when true', () => {
  const result = makeStringFromIsRootWorkflow(true);
  expect(result).toBe('freeText=root_wf');
});

test('Make string from isRootWorkflow with false', () => {
  const result = makeStringFromIsRootWorkflow(false);
  expect(result).toBe('freeText=*');
});

test('Make string from isRootWorkflow with null', () => {
  const result = makeStringFromIsRootWorkflow(null);
  expect(result).toBe('freeText=*');
});

test('Make string from isRootWorkflow with undefined', () => {
  const result = makeStringFromIsRootWorkflow(undefined);
  expect(result).toBe('freeText=*');
});

test('Make string from pagination', () => {
  const paginationArgs: PaginationArgs = {
    size: 10,
    start: 0,
  };
  const result = makeStringFromPagination(paginationArgs);
  expect(result).toBe('size=10&start=0');
});

test('Make string from Conductor Query object only with start time', () => {
  const query: ConductorQuery = {
    startTime: {
      from: 123,
      to: 456,
    },
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('startTime > 123 AND startTime < 456');
});

test('Make string from Conductor Query object only with start time and status', () => {
  const query: ConductorQuery = {
    startTime: {
      from: 123,
      to: 456,
    },
    status: ['COMPLETED'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('startTime > 123 AND startTime < 456 AND status IN (COMPLETED)');
});

test('Make string from Conductor Query object only with start time and status and workflowId', () => {
  const query: ConductorQuery = {
    startTime: {
      from: 123,
      to: 456,
    },
    status: ['COMPLETED'],
    workflowId: ['123'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('startTime > 123 AND startTime < 456 AND status IN (COMPLETED) AND workflowId IN (123)');
});

test('Make string from Conductor Query with multiple statuses', () => {
  const query: ConductorQuery = {
    status: ['COMPLETED', 'FAILED'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('status IN (COMPLETED,FAILED)');
});

test('Make string from Conductor Query with multiple workflowIds', () => {
  const query: ConductorQuery = {
    workflowId: ['123', '456'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('workflowId IN (123,456)');
});

test('Make string from Conductor Query with multiple workflowTypes', () => {
  const query: ConductorQuery = {
    workflowType: ['123', '456'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('workflowType IN (123,456)');
});

test('Make string from Conductor Query with multiple workflowTypes and workflowIds', () => {
  const query: ConductorQuery = {
    workflowType: ['123', '456'],
    workflowId: ['123', '456'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe('workflowType IN (123,456) AND workflowId IN (123,456)');
});

test('Make string from Conductor Query with multiple workflowTypes, workflowIds, start time and statuses', () => {
  const query: ConductorQuery = {
    workflowType: ['123', '456'],
    workflowId: ['123', '456'],
    startTime: {
      from: 123,
      to: 456,
    },
    status: ['COMPLETED', 'FAILED'],
  };

  const result = makeStringFromQuery(query);
  expect(result).toBe(
    'workflowType IN (123,456) AND workflowId IN (123,456) AND startTime > 123 AND startTime < 456 AND status IN (COMPLETED,FAILED)',
  );
});

test('Make string from Search Query object and Pagination object', () => {
  const query: SearchQuery = {
    isRootWorkflow: true,
    query: {
      workflowType: ['123', '456'],
      workflowId: ['123', '456'],
      startTime: {
        from: 123,
        to: 456,
      },
      status: ['COMPLETED', 'FAILED'],
    },
  };

  const pagination: PaginationArgs = {
    size: 10,
    start: 0,
  };

  const result = makeStringQueryFromSearchQueryObject(query, pagination);
  expect(result).toBe(
    'query=workflowType IN (123,456) AND workflowId IN (123,456) AND startTime > 123 AND startTime < 456 AND status IN (COMPLETED,FAILED)&freeText=root_wf&size=10&start=0',
  );
});

test('Make string from Pagination', () => {
  const pagination: PaginationArgs = {
    size: 10,
    start: 0,
  };

  const result = makeStringQueryFromSearchQueryObject(null, pagination);
  expect(result).toBe('freeText=*&size=10&start=0');
});

test('Make string from Search Query object (isRootWorkflow = false) and pagination is null', () => {
  const query: SearchQuery = {
    isRootWorkflow: false,
    query: {
      workflowType: ['123', '456'],
      workflowId: ['123'],
      startTime: {
        from: 123,
      },
      status: ['COMPLETED', 'FAILED'],
    },
  };

  const result = makeStringQueryFromSearchQueryObject(query, null);
  expect(result).toBe(
    'query=workflowType IN (123,456) AND workflowId IN (123) AND startTime > 123 AND status IN (COMPLETED,FAILED)&freeText=*',
  );
});

test('Make string from Search Query object (isRootWorkflow = false) and pagination is undefined', () => {
  const query: SearchQuery = {
    isRootWorkflow: false,
    query: {
      workflowType: ['123'],
      workflowId: ['123'],
      startTime: {
        from: 123,
      },
      status: ['COMPLETED'],
    },
  };

  const result = makeStringQueryFromSearchQueryObject(query, undefined);
  expect(result).toBe(
    'query=workflowType IN (123) AND workflowId IN (123) AND startTime > 123 AND status IN (COMPLETED)&freeText=*',
  );
});

test('Make string query when SearchQuery object and Pagination object are null', () => {
  const result = makeStringQueryFromSearchQueryObject(null, null);
  expect(result).toBe('freeText=*');
});

test('Make string query when SearchQuery object and Pagination object are undefined', () => {
  const result = makeStringQueryFromSearchQueryObject(undefined, undefined);
  expect(result).toBe('freeText=*');
});

test('Make string query when SearchQuery object is null and Pagination object is undefined and (isRootWorkflow = true)', () => {
  const query: SearchQuery = {
    isRootWorkflow: true,
  };
  const result = makeStringQueryFromSearchQueryObject(query, undefined);
  expect(result).toBe('freeText=root_wf');
});
