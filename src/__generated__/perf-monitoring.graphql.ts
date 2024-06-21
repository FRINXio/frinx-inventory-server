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

/** Represents the percentage usage value. Includes also device name. */
export type Percentage = {
  __typename?: 'Percentage';
  device: Scalars['String'];
  usage: Maybe<Scalars['Float']>;
};

/** Represents a percentage value at a specific time. */
export type PercentageInTime = {
  __typename?: 'PercentageInTime';
  /** The timestamp indicating when the percentage value was recorded. */
  time: Scalars['Datetime'];
  /** The percentage value recorded at the given time. */
  usage: Scalars['Float'];
};

/** Represents a series of percentage values over time. Includes also device name. */
export type PercentageInTimeSeries = {
  __typename?: 'PercentageInTimeSeries';
  device: Scalars['String'];
  usages: Maybe<Array<PercentageInTime>>;
};

export type Query = {
  __typename?: 'Query';
  /** Read CPU usages in time range for single device. */
  cpuUsage: PercentageInTimeSeries;
  /** Read CPU usages in time range for multiple devices. */
  cpuUsages: Maybe<Array<PercentageInTimeSeries>>;
  /** Read the current CPU usage for single device. */
  currentCpuUsage: Percentage;
  /** Read the current CPU usage for multiple devices. */
  currentCpuUsages: Maybe<Array<Percentage>>;
  /** Read the current memory usage for single device. */
  currentMemoryUsage: Percentage;
  /** Read the current memory usage for multiple devices. */
  currentMemoryUsages: Maybe<Array<Percentage>>;
  /** Read memory usages in time range for single device. */
  memoryUsage: PercentageInTimeSeries;
  /** Read memory usages in time range for multiple devices. */
  memoryUsages: Maybe<Array<PercentageInTimeSeries>>;
};


export type QueryCpuUsageArgs = {
  bucket_width?: InputMaybe<BucketWidth>;
  device: Scalars['String'];
  end_time?: InputMaybe<Scalars['Datetime']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};


export type QueryCpuUsagesArgs = {
  bucket_width?: InputMaybe<BucketWidth>;
  devices: Array<Scalars['String']>;
  end_time?: InputMaybe<Scalars['Datetime']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};


export type QueryCurrentCpuUsageArgs = {
  device: Scalars['String'];
};


export type QueryCurrentCpuUsagesArgs = {
  devices: Array<Scalars['String']>;
};


export type QueryCurrentMemoryUsageArgs = {
  device: Scalars['String'];
};


export type QueryCurrentMemoryUsagesArgs = {
  devices: Array<Scalars['String']>;
};


export type QueryMemoryUsageArgs = {
  bucket_width?: InputMaybe<BucketWidth>;
  device: Scalars['String'];
  end_time?: InputMaybe<Scalars['Datetime']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};


export type QueryMemoryUsagesArgs = {
  bucket_width?: InputMaybe<BucketWidth>;
  devices?: InputMaybe<Array<Scalars['String']>>;
  end_time?: InputMaybe<Scalars['Datetime']>;
  start_time?: InputMaybe<Scalars['Datetime']>;
};

export type CurrentMemoryUsagesQueryVariables = Exact<{
  names: Array<Scalars['String']> | Scalars['String'];
}>;


export type CurrentMemoryUsagesQuery = { __typename?: 'Query', currentMemoryUsages: Array<{ __typename?: 'Percentage', device: string, usage: number | null }> | null };

export type CurrentCpuUsagesQueryVariables = Exact<{
  names: Array<Scalars['String']> | Scalars['String'];
}>;


export type CurrentCpuUsagesQuery = { __typename?: 'Query', currentCpuUsages: Array<{ __typename?: 'Percentage', device: string, usage: number | null }> | null };

export type CurrentMemoryUsageQueryVariables = Exact<{
  name: Scalars['String'];
}>;


export type CurrentMemoryUsageQuery = { __typename?: 'Query', currentMemoryUsage: { __typename?: 'Percentage', device: string, usage: number | null } };

export type CurrentCpuUsageQueryVariables = Exact<{
  name: Scalars['String'];
}>;


export type CurrentCpuUsageQuery = { __typename?: 'Query', currentCpuUsage: { __typename?: 'Percentage', device: string, usage: number | null } };
