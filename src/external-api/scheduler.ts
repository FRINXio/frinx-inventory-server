import { PaginationArgs } from 'nexus/dist/plugins/connectionPlugin';
import { GraphQLClient, gql } from 'graphql-request';
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
} from '../__generated__/scheduler.graphql';
import config from '../config';

const client = new GraphQLClient(config.schedulerApiURL, { headers: {} });

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

async function getSchedules(
  paginationArgs: PaginationArgs,
  filter: SchedulesFilterInput | null | undefined,
): Promise<GetSchedulesQuery> {
  const response = await client.request<GetSchedulesQuery, GetSchedulesQueryVariables>(GET_SCHEDULES_QUERY, {
    ...paginationArgs,
    filter,
  });

  return response;
}

async function getSchedule(scheduleName: string): Promise<GetScheduleQuery['schedule']> {
  const response = await client.request<GetScheduleQuery, GetScheduleQueryVariables>(GET_SCHEDULE_QUERY, {
    scheduleName,
  });

  return response.schedule;
}

async function createWorkflowSchedule(
  input: CreateScheduleInput,
): Promise<Omit<CreateScheduleMutation, '__typename'>['createSchedule']> {
  const response = await client.request<CreateScheduleMutation, CreateScheduleMutationVariables>(
    CREATE_SCHEDULE_MUTATION,
    { input },
  );

  return response.createSchedule;
}

async function editWorkflowSchedule(
  name: string,
  input: UpdateScheduleInput,
): Promise<UpdateScheduleMutation['updateSchedule']> {
  const response = await client.request<UpdateScheduleMutation, UpdateScheduleMutationVariables>(
    UPDATE_SCHEDULE_MUTATION,
    {
      input,
      scheduleName: name,
    },
  );

  return response.updateSchedule;
}

async function deleteSchedule(scheduleName: string): Promise<boolean> {
  const response = await client.request<DeleteScheduleMutation, DeleteScheduleMutationVariables>(
    DELETE_SCHEDULE_MUTATION,
    { scheduleName },
  );

  return response.deleteSchedule;
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
