import { ApiEventHandler, ApiEventHandlerAction } from '../external-api/conductor-network-types';

type StartWorkflowGraphQL = {
  name?: string | null;
  version?: number | null;
  input?: string | null;
  correlationId?: string | null;
  taskToDomain?: string | null;
};

type CompleteTaskGraphQL = {
  workflowId?: string | null;
  taskId?: string | null;
  output?: string | null;
  taskRefName?: string | null;
};

type FailTaskGraphQL = {
  workflowId?: string | null;
  taskId?: string | null;
  output?: string | null;
  taskRefName?: string | null;
};

type EventHandlerActionGraphQL = {
  action?: 'start_workflow' | 'complete_task' | 'fail_task' | null;
  startWorkflow?: StartWorkflowGraphQL | null;
  completeTask?: CompleteTaskGraphQL | null;
  failTask?: FailTaskGraphQL | null;
  expandInlineJSON?: boolean | null;
};

type EventHandlerGraphQL = {
  name: string;
  event: string;
  isActive?: boolean | null;
  condition?: string | null;
  actions: EventHandlerActionGraphQL[];
  evaluatorType?: string | null;
};

function makeFromApiToGraphQLActionStartWorkflow(actionStartWorkflow: ApiEventHandlerAction['startWorkflow']) {
  if (actionStartWorkflow == null) {
    return undefined;
  }

  return {
    name: actionStartWorkflow.name || undefined,
    version: actionStartWorkflow.version || undefined,
    input: actionStartWorkflow != null ? JSON.stringify(actionStartWorkflow.input) : undefined,
    correlationId: actionStartWorkflow.correlationId || undefined,
    taskToDomain: actionStartWorkflow != null ? JSON.stringify(actionStartWorkflow.taskToDomain) : undefined,
  };
}

function makeFromApiToGraphQLActionCompleteTask(actionCompleteTask: ApiEventHandlerAction['completeTask']) {
  if (actionCompleteTask == null) {
    return undefined;
  }

  return {
    workflowId: actionCompleteTask.workflowId || undefined,
    taskId: actionCompleteTask.taskId || undefined,
    output: actionCompleteTask != null ? JSON.stringify(actionCompleteTask.output) : undefined,
    taskRefName: actionCompleteTask.taskRefName || undefined,
  };
}

function makeFromApiToGraphQLActionFailTask(actionFailTask: ApiEventHandlerAction['failTask']) {
  if (actionFailTask == null) {
    return undefined;
  }

  return {
    workflowId: actionFailTask.workflowId || undefined,
    taskId: actionFailTask.taskId || undefined,
    output: actionFailTask != null ? JSON.stringify(actionFailTask.output) : undefined,
    taskRefName: actionFailTask.taskRefName || undefined,
  };
}

export function makeFromApiToGraphQLEventHandlerAction(eventHandlerAction: ApiEventHandlerAction) {
  return {
    action: eventHandlerAction.action || undefined,
    startWorkflow: makeFromApiToGraphQLActionStartWorkflow(eventHandlerAction.startWorkflow) || undefined,
    completeTask: makeFromApiToGraphQLActionCompleteTask(eventHandlerAction.completeTask) || undefined,
    failTask: makeFromApiToGraphQLActionFailTask(eventHandlerAction.failTask) || undefined,
    expandInlineJSON: eventHandlerAction.expandInlineJSON || undefined,
  };
}

export function makeFromApiToGraphQLEventHandler(eventHandler: ApiEventHandler) {
  return {
    name: eventHandler.name,
    event: eventHandler.event,
    isActive: eventHandler.active || false,
    condition: eventHandler.condition || undefined,
    actions: eventHandler.actions.map(makeFromApiToGraphQLEventHandlerAction),
    evaluatorType: eventHandler.evaluatorType || undefined,
  };
}

// add function that will convert from GraphQL to API

function makeFromGraphQLToApiActionStartWorkflow(
  actionStartWorkflow?: StartWorkflowGraphQL | null,
): ApiEventHandlerAction['startWorkflow'] {
  if (actionStartWorkflow == null) {
    return undefined;
  }

  return {
    name: actionStartWorkflow.name || undefined,
    version: actionStartWorkflow.version || undefined,
    input: actionStartWorkflow.input != null ? JSON.parse(actionStartWorkflow.input) : undefined,
    correlationId: actionStartWorkflow.correlationId || undefined,
    taskToDomain: actionStartWorkflow.taskToDomain != null ? JSON.parse(actionStartWorkflow.taskToDomain) : undefined,
  };
}

function makeFromGraphQLToApiActionCompleteTask(
  actionCompleteTask?: CompleteTaskGraphQL | null,
): ApiEventHandlerAction['completeTask'] {
  if (actionCompleteTask == null) {
    return undefined;
  }

  return {
    workflowId: actionCompleteTask.workflowId || undefined,
    taskId: actionCompleteTask.taskId || undefined,
    output: actionCompleteTask.output != null ? JSON.parse(actionCompleteTask.output) : undefined,
    taskRefName: actionCompleteTask.taskRefName || undefined,
  };
}

function makeFromGraphQLToApiActionFailTask(
  actionFailTask?: FailTaskGraphQL | null,
): ApiEventHandlerAction['failTask'] {
  if (actionFailTask == null) {
    return undefined;
  }

  return {
    workflowId: actionFailTask.workflowId || undefined,
    taskId: actionFailTask.taskId || undefined,
    output: actionFailTask.output != null ? JSON.parse(actionFailTask.output) : undefined,
    taskRefName: actionFailTask.taskRefName || undefined,
  };
}

function makeFromGraphQLToApiEventHandlerAction(eventHandlerAction: EventHandlerActionGraphQL): ApiEventHandlerAction {
  return {
    action: eventHandlerAction.action || undefined,
    startWorkflow: makeFromGraphQLToApiActionStartWorkflow(eventHandlerAction.startWorkflow) || undefined,
    completeTask: makeFromGraphQLToApiActionCompleteTask(eventHandlerAction.completeTask) || undefined,
    failTask: makeFromGraphQLToApiActionFailTask(eventHandlerAction.failTask) || undefined,
    expandInlineJSON: eventHandlerAction.expandInlineJSON || undefined,
  };
}

export function makeFromGraphQLToApiEventHandler(eventHandler: EventHandlerGraphQL): ApiEventHandler {
  return {
    name: eventHandler.name,
    event: eventHandler.event,
    active: eventHandler.isActive || undefined,
    condition: eventHandler.condition || undefined,
    actions: eventHandler.actions.map(makeFromGraphQLToApiEventHandlerAction),
    evaluatorType: eventHandler.evaluatorType || undefined,
  };
}
