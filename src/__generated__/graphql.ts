export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  JSON: any;
};

export type CreateScheduleInput = {
  cronString: Scalars['String'];
  enabled?: InputMaybe<Scalars['Boolean']>;
  fromDate?: InputMaybe<Scalars['DateTime']>;
  name: Scalars['String'];
  parallelRuns?: InputMaybe<Scalars['Boolean']>;
  toDate?: InputMaybe<Scalars['DateTime']>;
  workflowContext?: InputMaybe<Scalars['String']>;
  workflowName: Scalars['String'];
  workflowVersion: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createSchedule: Schedule;
  deleteSchedule: Scalars['Boolean'];
  updateSchedule: Schedule;
};


export type MutationCreateScheduleArgs = {
  input: CreateScheduleInput;
};


export type MutationDeleteScheduleArgs = {
  name: Scalars['String'];
};


export type MutationUpdateScheduleArgs = {
  input: UpdateScheduleInput;
  name: Scalars['String'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  schedule: Maybe<Schedule>;
  schedules: Maybe<ScheduleConnection>;
};


export type QueryScheduleArgs = {
  name: Scalars['String'];
};


export type QuerySchedulesArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<SchedulesFilterInput>;
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
};

export type Schedule = {
  __typename?: 'Schedule';
  cronString: Scalars['String'];
  enabled: Scalars['Boolean'];
  fromDate: Scalars['DateTime'];
  name: Scalars['String'];
  parallelRuns: Scalars['Boolean'];
  status: Status;
  toDate: Scalars['DateTime'];
  workflowContext: Scalars['String'];
  workflowName: Scalars['String'];
  workflowVersion: Scalars['String'];
};

export type ScheduleConnection = {
  __typename?: 'ScheduleConnection';
  edges: Array<Maybe<ScheduleEdge>>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int'];
};

export type ScheduleEdge = {
  __typename?: 'ScheduleEdge';
  cursor: Scalars['String'];
  node: Schedule;
};

export type SchedulesFilterInput = {
  workflowName: Scalars['String'];
  workflowVersion: Scalars['String'];
};

export type Status =
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED'
  | 'RUNNING'
  | 'TERMINATED'
  | 'TIMED_OUT'
  | 'UNKNOWN';

export type UpdateScheduleInput = {
  cronString?: InputMaybe<Scalars['String']>;
  enabled?: InputMaybe<Scalars['Boolean']>;
  fromDate?: InputMaybe<Scalars['DateTime']>;
  parallelRuns?: InputMaybe<Scalars['Boolean']>;
  toDate?: InputMaybe<Scalars['DateTime']>;
  workflowContext?: InputMaybe<Scalars['String']>;
  workflowName?: InputMaybe<Scalars['String']>;
  workflowVersion?: InputMaybe<Scalars['String']>;
};

export type DeleteScheduleMutationVariables = Exact<{
  scheduleName: Scalars['String'];
}>;


export type DeleteScheduleMutation = { __typename?: 'Mutation', deleteSchedule: boolean };

export type UpdateScheduleMutationVariables = Exact<{
  scheduleName: Scalars['String'];
  input: UpdateScheduleInput;
}>;


export type UpdateScheduleMutation = { __typename?: 'Mutation', updateSchedule: { __typename?: 'Schedule', name: string, enabled: boolean, parallelRuns: boolean, workflowName: string, workflowVersion: string, cronString: string, workflowContext: string, fromDate: any, toDate: any, status: Status } };

export type CreateScheduleMutationVariables = Exact<{
  input: CreateScheduleInput;
}>;


export type CreateScheduleMutation = { __typename?: 'Mutation', createSchedule: { __typename?: 'Schedule', name: string, enabled: boolean, parallelRuns: boolean, workflowName: string, workflowVersion: string, cronString: string, workflowContext: string, fromDate: any, toDate: any, status: Status } };

export type GetScheduleQueryVariables = Exact<{
  scheduleName: Scalars['String'];
}>;


export type GetScheduleQuery = { __typename?: 'Query', schedule: { __typename?: 'Schedule', name: string, enabled: boolean, parallelRuns: boolean, workflowName: string, workflowVersion: string, cronString: string, workflowContext: string, fromDate: any, toDate: any, status: Status } | null };

export type GetSchedulesQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']>;
  last?: InputMaybe<Scalars['Int']>;
  before?: InputMaybe<Scalars['String']>;
  after?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<SchedulesFilterInput>;
}>;


export type GetSchedulesQuery = { __typename?: 'Query', schedules: { __typename?: 'ScheduleConnection', totalCount: number, edges: Array<{ __typename?: 'ScheduleEdge', cursor: string, node: { __typename?: 'Schedule', name: string, enabled: boolean, parallelRuns: boolean, workflowName: string, workflowVersion: string, cronString: string, workflowContext: string, fromDate: any, toDate: any, status: Status } } | null>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } | null };
