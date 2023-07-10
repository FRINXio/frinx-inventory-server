import {
    ApiEventHandler,
    ApiEventHandlerAction
} from "../external-api/conductor-network-types";

function makeFromApiToGraphQLActionStartWorkflow(actionStartWorkflow: ApiEventHandlerAction["startWorkflow"]) {
    if (actionStartWorkflow == null) {
        return undefined;
    }

    return {
        name: actionStartWorkflow.name || undefined,
        version: actionStartWorkflow.version || undefined,
        input: actionStartWorkflow != null ? JSON.stringify(actionStartWorkflow.input) : undefined,
        correlationId: actionStartWorkflow.correlationId || undefined,
        taskToDomain: actionStartWorkflow != null ? JSON.stringify(actionStartWorkflow.taskToDomain) : undefined,
    }
}

function makeFromApiToGraphQLActionCompleteTask(actionCompleteTask: ApiEventHandlerAction["completeTask"]) {
    if (actionCompleteTask == null) {
        return undefined;
    }

    return {
        workflowId: actionCompleteTask.workflowId || undefined,
        taskId: actionCompleteTask.taskId || undefined,
        output: actionCompleteTask != null ? JSON.stringify(actionCompleteTask.output) : undefined,
        taskRefName: actionCompleteTask.taskRefName || undefined,
    }
}

function makeFromApiToGraphQLActionFailTask(actionFailTask: ApiEventHandlerAction["failTask"]) {
    if (actionFailTask == null) {
        return undefined;
    }

    return {
        workflowId: actionFailTask.workflowId || undefined,
        taskId: actionFailTask.taskId || undefined,
        output: actionFailTask != null ? JSON.stringify(actionFailTask.output) : undefined,
        taskRefName: actionFailTask.taskRefName || undefined,
    }
}

function makeFromApiToGraphQLEventHandlerAction(eventHandlerAction: ApiEventHandlerAction) {
    return {
        action: eventHandlerAction.action || undefined,
        startWorkflow: makeFromApiToGraphQLActionStartWorkflow(eventHandlerAction.startWorkflow) || undefined,
        completeTask: makeFromApiToGraphQLActionCompleteTask(eventHandlerAction.completeTask) || undefined,
        failTask: makeFromApiToGraphQLActionFailTask(eventHandlerAction.failTask) || undefined,
        expandInlineJSON: eventHandlerAction.expandInlineJSON || undefined,
    }
}

export function makeFromApiToGraphQLEventHandler(eventHandler: ApiEventHandler) {
    return {
        name: eventHandler.name,
        event: eventHandler.event,
        isActive: eventHandler.active || undefined,
        condition: eventHandler.condition || undefined,
        actions: eventHandler.actions.map(makeFromApiToGraphQLEventHandlerAction),
        evaluatorType: eventHandler.evaluatorType || undefined,
    }
}