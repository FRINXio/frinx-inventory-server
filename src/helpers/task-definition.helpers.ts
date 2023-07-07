type TaskDefinitionDetailInput = {
  name: string;
  timeoutSeconds: number;
  createdBy?: string | null | undefined;
  updatedBy?: string | null | undefined;
  retryCount?: number | null | undefined;
  pollTimeoutSeconds?: number | null | undefined;
  inputKeys?: string[] | null | undefined;
  outputKeys?: string[] | null | undefined;
  inputTemplate?: string | null | undefined;
  timeoutPolicy?: 'RETRY' | 'TIME_OUT_WF' | 'ALERT_ONLY' | null | undefined;
  retryLogic?: 'FIXED' | 'EXPONENTIAL_BACKOFF' | 'LINEAR_BACKOFF' | null | undefined;
  retryDelaySeconds?: number | null | undefined;
  responseTimeoutSeconds?: number | null | undefined;
  concurrentExecLimit?: number | null | undefined;
  rateLimitFrequencyInSeconds?: number | null | undefined;
  rateLimitPerFrequency?: number | null | undefined;
  ownerEmail?: string | null | undefined;
  accessPolicy?: string | null | undefined;
  ownerApp?: string | null | undefined;
  description?: string | null | undefined;
  isolationGroupId?: string | null | undefined;
  executionNameSpace?: string | null | undefined;
  backoffScaleFactor?: number | null | undefined;
  createTime?: string | null | undefined;
  updateTime?: string | null | undefined;
};

export const getTaskDefinitionInput = (input: TaskDefinitionDetailInput) => {
  const taskDefinitionInput = {
    ...input,
    createdBy: input.createdBy ?? undefined,
    updatedBy: input.updatedBy ?? undefined,
    retryCount: input.retryCount ?? undefined,
    pollTimeoutSeconds: input.pollTimeoutSeconds ?? undefined,
    inputKeys: input.inputKeys ?? undefined,
    outputKeys: input.outputKeys ?? undefined,
    inputTemplate: input.inputTemplate ? JSON.parse(input.inputTemplate) : undefined,
    timeoutPolicy: input.timeoutPolicy ?? undefined,
    retryLogic: input.retryLogic ?? undefined,
    retryDelaySeconds: input.retryDelaySeconds ?? undefined,
    responseTimeoutSeconds: input.responseTimeoutSeconds ?? undefined,
    concurrentExecLimit: input.concurrentExecLimit ?? undefined,
    rateLimitFrequencyInSeconds: input.rateLimitFrequencyInSeconds ?? undefined,
    rateLimitPerFrequency: input.rateLimitPerFrequency ?? undefined,
    ownerEmail: input.ownerEmail ?? undefined,
    accessPolicy: input.accessPolicy ? JSON.parse(input.accessPolicy) : undefined,
    ownerApp: input.ownerApp ?? undefined,
    description: input.description ?? undefined,
    isolationGroupId: input.isolationGroupId ?? undefined,
    executionNameSpace: input.executionNameSpace ?? undefined,
    backoffScaleFactor: input.backoffScaleFactor ?? undefined,
    createTime: Date.now(),
    updateTime: Date.now(),
  };
  return taskDefinitionInput;
};
