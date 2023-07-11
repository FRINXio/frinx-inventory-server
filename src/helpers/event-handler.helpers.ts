import { ApiEventHandler, ApiEventHandlerAction } from '../external-api/conductor-network-types';

// ESLint does not support this enum, but this kind of enum is used also in Swagger docs
// eslint-disable-next-line no-shadow
enum EventHandlerActionType {
  START_WORKFLOW = 'start_workflow',
  COMPLETE_TASK = 'complete_task',
  FAIL_TASK = 'fail_task',
}

type StartWorkflowGraphQL = {
  name?: string;
  version?: number;
  input?: string;
  correlationId?: string;
  taskToDomain?: string;
};

type CompleteTaskGraphQL = {
  workflowId?: string;
  taskId?: string;
  output?: string;
  taskRefName?: string;
};

type FailTaskGraphQL = {
  workflowId?: string;
  taskId?: string;
  output?: string;
  taskRefName?: string;
};

type EventHandlerActionGraphQL = {
  action?: EventHandlerActionType;
  startWorkflow?: StartWorkflowGraphQL;
  completeTask?: CompleteTaskGraphQL;
  failTask?: FailTaskGraphQL;
  expandInlineJSON?: boolean;
};

type EventHandlerGraphQL = {
  name: string;
  event: string;
  isActive?: boolean;
  condition?: string;
  actions: EventHandlerActionGraphQL[];
  evaluatorType?: string;
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

function makeFromApiToGraphQLActionType(actionType: ApiEventHandlerAction['action']): EventHandlerActionType {
  switch (actionType) {
    case 'start_workflow':
      return EventHandlerActionType.START_WORKFLOW;
    case 'complete_task':
      return EventHandlerActionType.COMPLETE_TASK;
    case 'fail_task':
      return EventHandlerActionType.FAIL_TASK;
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

function makeFromApiToGraphQLEventHandlerAction(eventHandlerAction: ApiEventHandlerAction) {
  return {
    action: makeFromApiToGraphQLActionType(eventHandlerAction.action) || undefined,
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
    isActive: eventHandler.active || undefined,
    condition: eventHandler.condition || undefined,
    actions: eventHandler.actions.map(makeFromApiToGraphQLEventHandlerAction),
    evaluatorType: eventHandler.evaluatorType || undefined,
  };
}

// add function that will convert from GraphQL to API

function makeFromGraphQLToApiActionStartWorkflow(
  actionStartWorkflow?: StartWorkflowGraphQL,
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
  actionCompleteTask?: CompleteTaskGraphQL,
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

function makeFromGraphQLToApiActionFailTask(actionFailTask?: FailTaskGraphQL): ApiEventHandlerAction['failTask'] {
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
