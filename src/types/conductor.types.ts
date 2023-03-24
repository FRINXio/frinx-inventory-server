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

// eslint-disable-next-line no-shadow
enum TaskType {
  SIMPLE,
  DECISION,
  DYNAMIC,
  FORK_JOIN,
  JOIN,
  SUB_WORKFLOW,
  FORK_JOIN_DYNAMIC,
  EVENT,
  LAMBDA,
  HTTP,
  KAFKA_PUBLISH,
  TERMINATE,
  HUMAN,
  WAIT,
  JSON_JQ_TRANSFORM,
  SET_VARIABLE,
  DO_WHILE,
  START_WORKFLOW,
  USER_DEFINED,
  INLINE,
  EXCLUSIVE_JOIN,
  SWITCH,
}

export type Task = {
  name: string;
  taskReferenceName: string;
  description?: string | null;
  inputParameters?: Record<string, unknown> | null;
  type?: string | null;
  startDelay?: number | null;
  optional?: boolean | null;
  asyncComplete?: boolean | null;
  workflowTaskType?: (TaskType | null)[] | null;
  joinOn?: (string | null)[] | null;
  decisionCases?: Record<string, unknown[]> | null;
  defaultCase: unknown[];
  loopCondition?: string | null;
  retryCount?: number | null;
};

export type WorkflowDefinition = {
  name: string;
  tasks: Task[];
  timeoutSeconds: number;
  inputParameters?: (string | null)[] | null;
  outputParameters?: Record<string, unknown> | null;
  description?: string | null;
  schemaVersion?: number | null;
  version?: number | null;
  ownerApp?: string | null;
  ownerEmail?: string | null;
  variables?: Record<string, unknown> | null;
  inputTemplate?: Record<string, unknown> | null;
  timeoutPolicy?: 'TIME_OUT_WF' | 'ALERT_ONLY' | null;
  restartable?: boolean | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createTime?: number | null;
  updateTime?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

export type ExecuteNewWorkflowPayload = {
  name: string;
  version?: number | null;
  correlationId?: string | null;
  input?: Record<string, unknown> | null;
  taskToDomain?: Record<string, string> | null;
  externalInputPayloadStoragePath?: string | null;
  priority?: number | null;
  workflowDef?: WorkflowDefinition | null;
};
