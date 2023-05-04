import { Client, cacheExchange, fetchExchange, gql } from '@urql/core';
import { PaginationArgs } from 'nexus/dist/plugins/connectionPlugin';
import config from '../config';
import {
  CreateScheduleInput,
  CreateScheduleMutation,
  CreateScheduleMutationVariables,
  DeleteScheduleMutation,
  DeleteScheduleMutationVariables,
  GetScheduleQuery,
  GetScheduleQueryVariables,
  GetSchedulesQuery,
  GetSchedulesQueryVariables,
  SchedulesFilterInput,
  UpdateScheduleInput,
  UpdateScheduleMutation,
  UpdateScheduleMutationVariables,
} from '../__generated__/graphql';

const DELETE_SCHEDULE_MUTATION = gql`
  mutation DeleteSchedule($scheduleName: String!) {
    deleteSchedule(name: $scheduleName)
  }
`;

const UPDATE_SCHEDULE_MUTATION = gql`
  mutation UpdateSchedule($scheduleName: String!, $input: UpdateScheduleInput!) {
    updateSchedule(name: $scheduleName, input: $input) {
      name
      enabled
      parallelRuns
      workflowName
      workflowVersion
      cronString
      workflowContext
      fromDate
      toDate
      status
    }
  }
`;

const CREATE_SCHEDULE_MUTATION = gql`
  mutation CreateSchedule($input: CreateScheduleInput!) {
    createSchedule(input: $input) {
      name
      enabled
      parallelRuns
      workflowName
      workflowVersion
      cronString
      workflowContext
      fromDate
      toDate
      status
    }
  }
`;

const GET_SCHEDULE_QUERY = gql`
  query GetSchedule($scheduleName: String!) {
    schedule(name: $scheduleName) {
      name
      enabled
      parallelRuns
      workflowName
      workflowVersion
      cronString
      workflowContext
      fromDate
      toDate
      status
    }
  }
`;

const GET_SCHEDULES_QUERY = gql`
  query GetSchedules($first: Int, $last: Int, $before: String, $after: String, $filter: SchedulesFilterInput) {
    schedules(after: $after, before: $before, first: $first, last: $last, filter: $filter) {
      edges {
        node {
          name
          enabled
          parallelRuns
          workflowName
          workflowVersion
          cronString
          workflowContext
          fromDate
          toDate
          status
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const client = new Client({
  url: config.schedulerApiURL,
  exchanges: [cacheExchange, fetchExchange],
});

async function getSchedules(
  paginationArgs: PaginationArgs,
  filter: SchedulesFilterInput | null | undefined,
): Promise<GetSchedulesQuery> {
  const response = await client
    .query<GetSchedulesQuery, GetSchedulesQueryVariables>(GET_SCHEDULES_QUERY, {
      ...paginationArgs,
      filter,
    })
    .toPromise();

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data == null) {
    throw new Error('Could not get schedules');
  }

  return response.data;
}

async function getSchedule(scheduleName: string): Promise<GetScheduleQuery> {
  const response = await client
    .query<GetScheduleQuery, GetScheduleQueryVariables>(GET_SCHEDULE_QUERY, { scheduleName })
    .toPromise();

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data == null) {
    throw new Error(`Schedule ${scheduleName} not found`);
  }

  return response.data;
}

async function createWorkflowSchedule(input: CreateScheduleInput): Promise<Omit<CreateScheduleMutation, '__typename'>> {
  const response = await client
    .query<CreateScheduleMutation, CreateScheduleMutationVariables>(CREATE_SCHEDULE_MUTATION, { input })
    .toPromise();

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data == null) {
    throw new Error(`Creation of schedule ${input.name} failed`);
  }

  return response.data;
}

async function editWorkflowSchedule(name: string, input: UpdateScheduleInput): Promise<UpdateScheduleMutation> {
  const response = await client
    .query<UpdateScheduleMutation, UpdateScheduleMutationVariables>(UPDATE_SCHEDULE_MUTATION, {
      input,
      scheduleName: name,
    })
    .toPromise();

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (response.data == null) {
    throw new Error(`Update of schedule ${name} failed`);
  }

  return response.data;
}

async function deleteSchedule(scheduleName: string): Promise<boolean> {
  const response = await client
    .query<DeleteScheduleMutation, DeleteScheduleMutationVariables>(DELETE_SCHEDULE_MUTATION, { scheduleName })
    .toPromise();

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.deleteSchedule || false;
}

const schedulerAPI = {
  getSchedules,
  getSchedule,
  createWorkflowSchedule,
  editWorkflowSchedule,
  deleteSchedule,
};

export type SchedulerAPI = typeof schedulerAPI;
export default schedulerAPI;
