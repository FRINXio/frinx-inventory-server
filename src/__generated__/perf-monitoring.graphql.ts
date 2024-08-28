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
  Datetime: any;
};

/** Bucket width unit types. */
export type BucketUnit =
  | 'centuries'
  | 'days'
  | 'hours'
  | 'microseconds'
  | 'milliseconds'
  | 'minutes'
  | 'months'
  | 'seconds'
  | 'weeks'
  | 'years';

/**
 * Bucket width input type that wraps unit and value.
 * These two values will be join to create 'bucket_width' parameter for TimescaleDB time_bucket function.
 */
export type BucketWidth = {
  unit: BucketUnit;
  value: Scalars['Float'];
};

/** Represents a paginated connection of utilization data for multiple devices. */
export type BulkUtilizationConnection = {
  __typename?: 'BulkUtilizationConnection';
  /** A list of metrics for multiple devices, each with associated cursor information. */
  metrics: Array<MetricsEdge>;
  /** Information about the current page of results. */
  pageInfo: PageInfo;
};

/** Represents the current sources utilization of a single device. */
export type CurrentUtilization = {
  __typename?: 'CurrentUtilization';
  /** The unique identifier for the device. */
  device: Scalars['String'];
  /** The device metrics. */
  deviceMetrics: MetricsNode;
};

/** Represents an edge in a paginated list of device metrics. */
export type MetricsEdge = {
  __typename?: 'MetricsEdge';
  /** A cursor for pagination. */
  cursor: Scalars['String'];
  /** A list of device metrics associated with a specific device. */
  deviceMetrics: Array<MetricsWithDeviceNode>;
};

/** Interface representing device metrics. */
export type MetricsInterface = {
  /** The CPU utilization represented as a percentage. */
  cpu: Maybe<Scalars['Float']>;
  /** The memory utilization represented as a percentage. */
  memory: Maybe<Scalars['Float']>;
};

/** Base node type for metrics. */
export type MetricsNode = MetricsInterface & {
  __typename?: 'MetricsNode';
  cpu: Maybe<Scalars['Float']>;
  memory: Maybe<Scalars['Float']>;
};

/** Node type for metrics including a cursor. */
export type MetricsWithCursorNode = MetricsInterface & {
  __typename?: 'MetricsWithCursorNode';
  cpu: Maybe<Scalars['Float']>;
  /** The cursor used for pagination. */
  cursor: Maybe<Scalars['String']>;
  memory: Maybe<Scalars['Float']>;
};

/** Node type for metrics a device. */
export type MetricsWithDeviceNode = MetricsInterface & {
  __typename?: 'MetricsWithDeviceNode';
  cpu: Maybe<Scalars['Float']>;
  /** The device identifier. */
  device: Scalars['String'];
  memory: Maybe<Scalars['Float']>;
};

/** Pagination metadata that is usually coupled to a returned list of objects. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Pointer to the last object in the list. */
  endCursor: Maybe<Scalars['String']>;
  /** Indicates if there is a next object in the list. */
  hasNextPage: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  /** Read current utilization of multiple device sources. */
  bulkCurrentUtilization: Array<CurrentUtilization>;
  /** Read utilization of multiple device sources. */
  bulkUtilization: BulkUtilizationConnection;
  /** Read current utilization of single device sources. */
  currentUtilization: CurrentUtilization;
  /** Read utilization of single device device sources. */
  utilization: UtilizationConnection;
};


export type QueryBulkCurrentUtilizationArgs = {
  devices: Array<Scalars['String']>;
};


export type QueryBulkUtilizationArgs = {
  after?: InputMaybe<Scalars['String']>;
  bucket_width?: InputMaybe<BucketWidth>;
  devices: Array<Scalars['String']>;
  end_time?: InputMaybe<Scalars['Datetime']>;
  first?: InputMaybe<Scalars['Int']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};


export type QueryCurrentUtilizationArgs = {
  device: Scalars['String'];
};


export type QueryUtilizationArgs = {
  after?: InputMaybe<Scalars['String']>;
  bucket_width?: InputMaybe<BucketWidth>;
  device: Scalars['String'];
  end_time?: InputMaybe<Scalars['Datetime']>;
  first?: InputMaybe<Scalars['Int']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};

/** Represents a paginated connection of utilization data for a single device. */
export type UtilizationConnection = {
  __typename?: 'UtilizationConnection';
  /** The unique identifier for the device. */
  device: Scalars['String'];
  /** A list of device metrics with associated cursor information. */
  deviceMetrics: Array<MetricsWithCursorNode>;
  /** Information about the current page of results. */
  pageInfo: PageInfo;
};

export type BulkDeviceMetricsQueryVariables = Exact<{
  devices: Array<Scalars['String']> | Scalars['String'];
}>;


export type BulkDeviceMetricsQuery = { __typename?: 'Query', bulkCurrentUtilization: Array<{ __typename?: 'CurrentUtilization', device: string, deviceMetrics: { __typename?: 'MetricsNode', cpu: number | null, memory: number | null } }> };

export type DeviceMetricsQueryVariables = Exact<{
  device: Scalars['String'];
}>;


export type DeviceMetricsQuery = { __typename?: 'Query', currentUtilization: { __typename?: 'CurrentUtilization', device: string, deviceMetrics: { __typename?: 'MetricsNode', cpu: number | null, memory: number | null } } };
