import {arg, inputObjectType, objectType, queryField} from "nexus";
import {PaginationConnectionArgs} from "./global-types";
import config from "../config";
import {makeFromApiToGraphQLEventHandler} from "../helpers/event-handler.helpers";
import {connectionFromArray} from "graphql-relay";
import {toGraphId} from "../helpers/id-helper";

export const ActionStartWorkflow = objectType({
    name: 'ActionStartWorkflow',
    definition(t) {
        t.string('name');
        t.int('version');
        t.string('input');
        t.string('correlationId');
        t.string('taskToDomain');
    }
});

export const ActionCompleteTask = objectType({
    name: 'ActionCompleteTask',
    definition(t) {
        t.string('workflowId');
        t.string('taskId');
        t.string('output');
        t.string('taskRefName');
    }
});

export const ActionFailTask = objectType({
    name: 'ActionFailTask',
    definition(t) {
        t.string('workflowId');
        t.string('taskId');
        t.string('output');
        t.string('taskRefName');
    }
});

export const EventHandlerAction = objectType({
    name: 'EventHandlerAction',
    definition(t) {
        t.string('action');
        t.field('startWorkflow', {type: ActionStartWorkflow});
        t.field('completeTask', {type: ActionCompleteTask});
        t.field('failTask', {type: ActionFailTask});
        t.boolean('expandInlineJSON');
    }
});

export const EventHandler = objectType({
    name: 'EventHandler',
    definition(t) {
        t.implements('Node');
        t.nonNull.id('id');
        t.nonNull.string('name');
        t.nonNull.string('event');
        t.string('condition');
        t.nonNull.list.field('actions', {type: EventHandlerAction});
        t.boolean('isActive');
        t.string('evaluatorType');
    }
});

export const EventHandlerEdge = objectType({
    name: 'EventHandlerEdge',
    definition(t) {
        t.nonNull.field('node', {type: EventHandler});
        t.nonNull.string('cursor');
    }
});

export const EventHandlerConnection = objectType({
    name: 'EventHandlerConnection',
    definition(t) {
        t.nonNull.list.field('edges', {type: EventHandlerEdge});
        t.nonNull.field('pageInfo', {type: 'PageInfo'});
    }
});

export const FilterEventHandlerInput = inputObjectType({
    name: 'FilterEventHandlerInput',
    definition(t) {
        t.boolean('isActive');
        t.string('event');
        t.string('evaluatorType');
    }
})

export const EventHandlerQuery = queryField('eventHandlers', {
    type: EventHandlerConnection,
    args: {
        filter: arg({type: FilterEventHandlerInput}),
        ...PaginationConnectionArgs,
    },
    resolve: async (_, args, {conductorAPI}) => {
        const {filter, ...paginationArgs} = args;
        const eventHandlers = await conductorAPI.getEventHandlers(config.conductorApiURL);

        const filteredEventHandlers = eventHandlers.filter(eventHandler => {
            if (filter?.isActive != null && eventHandler.active !== filter.isActive) {
                return false;
            }

            if (filter?.event != null && eventHandler.event !== filter.event) {
                return false;
            }

            if (filter?.evaluatorType != null && eventHandler.evaluatorType !== filter.evaluatorType) {
                return false;
            }

            return true;
        });

        const mappedEventHandlers = filteredEventHandlers.map((eventHandler) => ({
            id: toGraphId('EventHandler', eventHandler.name),
            ...makeFromApiToGraphQLEventHandler(eventHandler)
        }));
        return connectionFromArray(mappedEventHandlers, paginationArgs);
    }
});