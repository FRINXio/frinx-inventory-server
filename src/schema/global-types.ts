import countries from 'i18n-iso-countries';
import { extendType, idArg, intArg, interfaceType, nonNull, objectType, stringArg } from 'nexus';
import config from '../config';
import conductorAPI from '../external-api/conductor';
import { fromGraphId, getType } from '../helpers/id-helper';
import schedulerAPI from '../external-api/scheduler';
import resourceManagerAPI from '../external-api/resource-manager';
import { apiPoolEdgeToGraphqlPoolEdge } from '../helpers/resource-manager.helpers';

export const Node = interfaceType({
  name: 'Node',
  definition: (t) => {
    t.nonNull.id('id');
    t.int('version'); // this is only used for Workflow, because it has composite id (name/version)
  },
});
export const PageInfo = objectType({
  name: 'PageInfo',
  definition: (t) => {
    t.string('startCursor');
    t.string('endCursor');
    t.nonNull.boolean('hasNextPage');
    t.nonNull.boolean('hasPreviousPage');
  },
});
export const PaginationConnectionArgs = {
  first: intArg(),
  after: stringArg(),
  last: intArg(),
  before: stringArg(),
};
export const NodeQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('node', {
      type: Node,
      args: {
        id: nonNull(idArg()),
        version: intArg(),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        /* eslint-disable @typescript-eslint/naming-convention */
        const type = getType(args.id);
        switch (type) {
          case 'Device': {
            const id = fromGraphId('Device', args.id);
            const device = await prisma.device.findFirst({
              where: { id, tenantId },
            });
            if (device == null) {
              return null;
            }
            if (device == null) {
              throw new Error('device not found');
            }
            return { ...device, __typename: 'Device' };
          }
          case 'Zone': {
            const id = fromGraphId('Zone', args.id);
            const zone = await prisma.uniconfigZone.findFirst({
              where: { id, tenantId },
            });
            if (zone == null) {
              return null;
            }
            return { ...zone, __typename: 'Zone' };
          }
          case 'Label': {
            const id = fromGraphId('Label', args.id);
            const label = await prisma.label.findFirst({ where: { id, tenantId } });
            if (label == null) {
              return null;
            }
            return { ...label, __typename: 'Label' };
          }
          case 'Location': {
            const id = fromGraphId('Location', args.id);
            const location = await prisma.location.findFirst({ where: { id, tenantId } });
            if (location == null) {
              return null;
            }
            return { ...location, __typename: 'Location' };
          }
          case 'Country': {
            const id = fromGraphId('Country', args.id);
            if (!countries.isValid(id)) {
              return null;
            }
            const countryName = countries.getName(id, 'en', { select: 'official' });
            return {
              id: args.id,
              code: id,
              name: countryName,
              __typename: 'Country',
            };
          }
          case 'Blueprint': {
            const id = fromGraphId('Blueprint', args.id);
            const blueprint = await prisma.blueprint.findFirst({ where: { id, tenantId } });
            if (blueprint == null) {
              return null;
            }
            return { ...blueprint, __typename: 'Blueprint' };
          }
          case 'Workflow': {
            const id = fromGraphId('Workflow', args.id);
            const workflow = await conductorAPI.getWorkflowDetail(
              config.conductorApiURL,
              id,
              args.version ?? undefined,
            );
            if (workflow == null) {
              return null;
            }
            return { ...workflow, id: args.id, __typename: 'Workflow' };
          }
          case 'ExecutedWorkflow': {
            const id = fromGraphId('ExecutedWorkflow', args.id);
            const workflow = await conductorAPI.getExecutedWorkflowDetail(config.conductorApiURL, id);
            if (workflow == null) {
              return null;
            }
            return { ...workflow, id: args.id, __typename: 'ExecutedWorkflow' };
          }
          case 'Pool': {
            const id = fromGraphId('Pool', args.id);
            const apiPool = await resourceManagerAPI.getPool(id);

            if (apiPool == null) {
              return null;
            }

            const pool = apiPoolEdgeToGraphqlPoolEdge(apiPool);

            return { ...pool, id: args.id, __typename: 'Pool' };
          }
          case 'Schedule': {
            const id = fromGraphId('Schedule', args.id);
            const schedule = await schedulerAPI.getSchedule(id);

            if (schedule == null) {
              return null;
            }

            return { ...schedule, id: args.id, __typename: 'Schedule' };
          }
          case 'ExecutedWorkflowTask': {
            const id = fromGraphId('ExecutedWorkflowTask', args.id);
            const task = await conductorAPI.getExecutedWorkflowTaskDetail(config.conductorApiURL, id);
            if (task == null) {
              return null;
            }

            return { ...task, id: args.id, __typename: 'ExecutedWorkflowTask' };
          }
          /* eslint-enable */
          default:
            return null;
        }
      },
    });
  },
});

export const IsOkResponse = objectType({
  name: 'IsOkResponse',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});
