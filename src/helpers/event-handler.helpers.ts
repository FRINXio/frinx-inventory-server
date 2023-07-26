import { ApiEventHandler, ApiEventHandlerAction } from '../external-api/conductor-network-types';
import { toGraphId } from './id-helper';

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

function makeFromApiToGraphQLActionStartWorkflow(actionStartWorkflow: ApiEventHandlerAction['start_workflow']) {
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

function makeFromApiToGraphQLActionCompleteTask(actionCompleteTask: ApiEventHandlerAction['complete_task']) {
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

function makeFromApiToGraphQLActionFailTask(actionFailTask: ApiEventHandlerAction['fail_task']) {
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
    startWorkflow: makeFromApiToGraphQLActionStartWorkflow(eventHandlerAction.start_workflow) || undefined,
    completeTask: makeFromApiToGraphQLActionCompleteTask(eventHandlerAction.complete_task) || undefined,
    failTask: makeFromApiToGraphQLActionFailTask(eventHandlerAction.fail_task) || undefined,
    expandInlineJSON: eventHandlerAction.expandInlineJSON || undefined,
  };
}

export function makeFromApiToGraphQLEventHandler(eventHandler: ApiEventHandler) {
  return {
    id: toGraphId('EventHandler', eventHandler.name),
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
): ApiEventHandlerAction['start_workflow'] {
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
): ApiEventHandlerAction['complete_task'] {
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
): ApiEventHandlerAction['fail_task'] {
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    start_workflow: makeFromGraphQLToApiActionStartWorkflow(eventHandlerAction.startWorkflow) || undefined,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    complete_task: makeFromGraphQLToApiActionCompleteTask(eventHandlerAction.completeTask) || undefined,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    fail_task: makeFromGraphQLToApiActionFailTask(eventHandlerAction.failTask) || undefined,
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

export const filterByName = (name?: string | null) => (eventHandler: ApiEventHandler) =>
  name != null && eventHandler.name.toLowerCase().includes(name.toLowerCase());

export const filterByEvaluatorType = (evaluatorType?: string | null) => (eventHandler: ApiEventHandler) =>
  evaluatorType != null &&
  eventHandler.evaluatorType != null &&
  eventHandler.evaluatorType.toLowerCase().includes(evaluatorType.toLowerCase());

export const filterByEvent = (event?: string | null) => (eventHandler: ApiEventHandler) =>
  event != null && eventHandler.event.toLowerCase().includes(event.toLowerCase());

export const filterByIsActive = (isActive?: boolean | null) => (eventHandler: ApiEventHandler) =>
  isActive != null && eventHandler.active != null && eventHandler.active === isActive;

export function filterEventHandlers(
  eventHandlers: ApiEventHandler[],
  filters?: {
    name?: string | null;
    evaluatorType?: string | null;
    event?: string | null;
    isActive?: boolean | null;
  } | null,
) {
  if (eventHandlers == null) {
    return [];
  }

  if (filters?.name != null && filters.name.length > 0) {
    return eventHandlers.filter(filterByName(filters.name));
  }

  if (filters?.evaluatorType != null && filters.evaluatorType.length > 0) {
    return eventHandlers.filter(filterByEvaluatorType(filters.evaluatorType));
  }

  if (filters?.event != null && filters.event.length > 0) {
    return eventHandlers.filter(filterByEvent(filters.event));
  }

  if (filters?.isActive != null) {
    return eventHandlers.filter(filterByIsActive(filters.isActive));
  }

  return eventHandlers;
}
