import {
  arg,
  booleanArg,
  enumType,
  inputObjectType,
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from 'nexus';
import { v4 as uuid } from 'uuid';
import { IsOkResponse, Node, PaginationConnectionArgs, SortDirection } from './global-types';
import config from '../config';
import {
  filterEventHandlers,
  getOrderedEventHandlers,
  makeFromApiToGraphQLEventHandler,
  makeFromGraphQLToApiEventHandler,
} from '../helpers/event-handler.helpers';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { connectionFromArray } from '../helpers/connection.helpers';

export const EventHandlerActionEnum = enumType({
  name: 'EventHandlerActionEnum',
  members: ['start_workflow', 'complete_task', 'fail_task'],
});

export const ActionStartWorkflow = objectType({
  name: 'ActionStartWorkflow',
  definition(t) {
    t.string('name');
    t.int('version');
    t.string('input');
    t.string('correlationId');
    t.string('taskToDomain');
  },
});

export const ActionCompleteTask = objectType({
  name: 'ActionCompleteTask',
  definition(t) {
    t.string('workflowId');
    t.string('taskId');
    t.string('output');
    t.string('taskRefName');
  },
});

export const ActionFailTask = objectType({
  name: 'ActionFailTask',
  definition(t) {
    t.string('workflowId');
    t.string('taskId');
    t.string('output');
    t.string('taskRefName');
  },
});

export const EventHandlerAction = objectType({
  name: 'EventHandlerAction',
  definition(t) {
    t.field('action', { type: EventHandlerActionEnum });
    t.field('startWorkflow', { type: ActionStartWorkflow });
    t.field('completeTask', { type: ActionCompleteTask });
    t.field('failTask', { type: ActionFailTask });
    t.boolean('expandInlineJSON');
  },
});

export const EventHandler = objectType({
  name: 'EventHandler',
  definition(t) {
    t.implements(Node);
    t.nonNull.id('id');
    t.nonNull.string('name', { description: 'The name is immutable and cannot be changed. Also it must be unique.' });
    t.nonNull.string('event', { description: 'The event is immutable and cannot be changed.' });
    t.string('condition');
    t.nonNull.list.nonNull.field('actions', { type: EventHandlerAction });
    t.boolean('isActive');
    t.string('evaluatorType');
  },
});

export const EventHandlerEdge = objectType({
  name: 'EventHandlerEdge',
  definition(t) {
    t.nonNull.field('node', { type: EventHandler });
    t.nonNull.string('cursor');
  },
});

export const EventHandlerConnection = objectType({
  name: 'EventHandlerConnection',
  definition(t) {
    t.list.nonNull.field('edges', { type: EventHandlerEdge });
    t.nonNull.field('pageInfo', { type: 'PageInfo' });
  },
});

export const FilterEventHandlerInput = inputObjectType({
  name: 'FilterEventHandlerInput',
  definition(t) {
    t.boolean('isActive');
    t.string('event');
    t.string('evaluatorType');
    t.string('name');
  },
});

export const SortEventHandlersBy = enumType({
  name: 'SortEventHandlersBy',
  members: ['isActive', 'name', 'evaluatorType', 'event'],
});

export const EventHandlersOrderByInput = inputObjectType({
  name: 'EventHandlersOrderByInput',
  definition: (t) => {
    t.nonNull.field('sortKey', { type: SortEventHandlersBy });
    t.nonNull.field('direction', { type: SortDirection });
  },
});

export const EventHandlerQuery = queryField('eventHandlers', {
  type: EventHandlerConnection,
  args: {
    filter: arg({ type: FilterEventHandlerInput }),
    ...PaginationConnectionArgs,
    orderBy: nonNull(EventHandlersOrderByInput),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { filter, orderBy: orderingArgs, ...paginationArgs } = args;
    const eventHandlers = await conductorAPI.getEventHandlers(config.conductorApiURL);

    const filteredEventHandlers = filterEventHandlers(eventHandlers, filter);
    const oredEventHandlers = getOrderedEventHandlers(
      filteredEventHandlers,
      orderingArgs.sortKey,
      orderingArgs.direction,
    );
    const mappedEventHandlersWithId = oredEventHandlers.map((eventHandler) => ({
      ...makeFromApiToGraphQLEventHandler(eventHandler),
    }));

    const mappedEventHandlers = mappedEventHandlersWithId.map((eventHandler) => ({
      ...eventHandler,
      actions: eventHandler.actions.map((action) => ({
        ...action,
        id: toGraphId('EventHandlerAction', uuid()),
      })),
    }));
    return connectionFromArray(mappedEventHandlers, paginationArgs);
  },
});

export const ActionStartWorkflowInput = inputObjectType({
  name: 'ActionStartWorkflowInput',
  definition(t) {
    t.string('name');
    t.int('version');
    t.string('input');
    t.string('correlationId');
    t.string('taskToDomain');
  },
});

export const ActionCompleteTaskInput = inputObjectType({
  name: 'ActionCompleteTaskInput',
  definition(t) {
    t.string('workflowId');
    t.string('taskId');
    t.string('output');
    t.string('taskRefName');
  },
});

export const ActionFailTaskInput = inputObjectType({
  name: 'ActionFailTaskInput',
  definition(t) {
    t.string('workflowId');
    t.string('taskId');
    t.string('output');
    t.string('taskRefName');
  },
});

export const EventHandlerActionInput = inputObjectType({
  name: 'EventHandlerActionInput',
  definition(t) {
    t.field('action', { type: EventHandlerActionEnum });
    t.field('startWorkflow', { type: ActionStartWorkflowInput });
    t.field('completeTask', { type: ActionCompleteTaskInput });
    t.field('failTask', { type: ActionFailTaskInput });
    t.boolean('expandInlineJSON');
  },
});

export const CreateEventHandlerInput = inputObjectType({
  name: 'CreateEventHandlerInput',
  definition(t) {
    t.nonNull.string('name', { description: 'The name is immutable and cannot be changed. Also it must be unique.' });
    t.nonNull.string('event', { description: 'The event is immutable and cannot be changed.' });
    t.string('condition');
    t.nonNull.list.nonNull.field('actions', { type: EventHandlerActionInput });
    t.boolean('isActive');
    t.string('evaluatorType');
  },
});

export const UpdateEventHandlerInput = inputObjectType({
  name: 'UpdateEventHandlerInput',
  definition(t) {
    t.string('condition');
    t.list.nonNull.field('actions', { type: EventHandlerActionInput });
    t.boolean('isActive');
    t.string('evaluatorType');
  },
});

export const CreateEventHandlerMutation = mutationField('createEventHandler', {
  type: EventHandler,
  args: {
    input: nonNull(arg({ type: CreateEventHandlerInput })),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { input } = args;
    await conductorAPI.createEventHandler(config.conductorApiURL, makeFromGraphQLToApiEventHandler(input));
    return {
      ...input,
      id: toGraphId('EventHandler', input.name),
    };
  },
});

export const UpdateEventHandlerMutation = mutationField('updateEventHandler', {
  type: EventHandler,
  args: {
    event: nonNull(stringArg()),
    name: nonNull(stringArg()),
    input: nonNull(arg({ type: UpdateEventHandlerInput })),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { input, event, name } = args;
    const oldEventHandler = await conductorAPI.getEventHandler(config.conductorApiURL, event, name);

    if (input.actions == null || input.actions.length === 0) {
      await conductorAPI.updateEventHandler(config.conductorApiURL, {
        ...oldEventHandler,
        ...makeFromGraphQLToApiEventHandler({
          ...input,
          actions: [],
          name,
          event,
        }),
        actions: oldEventHandler.actions,
      });
    } else {
      await conductorAPI.updateEventHandler(config.conductorApiURL, {
        ...oldEventHandler,
        ...makeFromGraphQLToApiEventHandler({
          ...input,
          actions: input.actions,
          name,
          event,
        }),
      });
    }

    const mappedEventHandler = makeFromApiToGraphQLEventHandler(oldEventHandler);

    return {
      ...mappedEventHandler,
      ...input,
      actions: input.actions == null ? mappedEventHandler.actions : input.actions,
      id: toGraphId('EventHandler', name),
    };
  },
});

export const DeleteEventHandlerMutation = mutationField('deleteEventHandler', {
  type: IsOkResponse,
  args: {
    id: nonNull(stringArg()),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { id } = args;
    const name = fromGraphId('EventHandler', id);
    await conductorAPI.deleteEventHandler(config.conductorApiURL, name);

    return {
      isOk: true,
    };
  },
});

export const GetEventHandler = queryField('eventHandler', {
  type: EventHandler,
  args: {
    event: nonNull(stringArg()),
    name: nonNull(stringArg()),
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { event, name } = args;
    const eventHandler = await conductorAPI.getEventHandler(config.conductorApiURL, event, name);

    const eventHandlerWithId = {
      ...makeFromApiToGraphQLEventHandler(eventHandler),
    };

    return {
      ...eventHandlerWithId,
      actions: eventHandlerWithId.actions.map((action) => ({
        ...action,
        id: toGraphId('EventHandlerAction', uuid()),
      })),
    };
  },
});

export const GetEventHandlersByEvent = queryField('eventHandlersByEvent', {
  type: 'EventHandlerConnection',
  args: {
    event: nonNull(stringArg()),
    activeOnly: booleanArg(),
    ...PaginationConnectionArgs,
  },
  resolve: async (_, args, { conductorAPI }) => {
    const { event } = args;
    const eventHandlers = await conductorAPI.getEventHandlersByEvent(
      config.conductorApiURL,
      event,
      args.activeOnly || false,
    );

    const mappedEventHandlers = eventHandlers.map((eventHandler) => ({
      ...makeFromApiToGraphQLEventHandler(eventHandler),
      // id: toGraphId('EventHandler', eventHandler.name),
    }));

    return connectionFromArray(mappedEventHandlers, {
      first: args.first,
      after: args.after,
      last: args.last,
      before: args.before,
    });
  },
});
