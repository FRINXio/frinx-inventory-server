import { findManyCursorConnection } from '@devoxa/prisma-relay-cursor-connection';
import { connectionFromArray } from 'graphql-relay';
import countries from 'i18n-iso-countries';
import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import { Node, PageInfo, PaginationConnectionArgs } from './global-types';

export const Location = objectType({
  name: 'Location',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Location', root.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('createdAt', {
      resolve: (root) => root.createdAt.toISOString(),
    });
    t.nonNull.string('updatedAt', {
      resolve: (root) => root.updatedAt.toISOString(),
    });
    t.nonNull.string('country');
  },
});

export const Country = objectType({
  name: 'Country',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.id('id', {
      resolve: (root) => toGraphId('Country', root.id),
    });
    t.nonNull.string('name');
    t.nonNull.string('code');
  },
});

export const CountryEdge = objectType({
  name: 'CountryEdge',
  definition: (t) => {
    t.nonNull.field('node', { type: Country });
    t.nonNull.string('cursor');
  },
});
export const CountryConnection = objectType({
  name: 'CountryConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: CountryEdge });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});
export const CountryQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('countries', {
      type: CountryConnection,
      args: PaginationConnectionArgs,
      resolve: (_, args) => {
        const nameObject = countries.getNames('en', { select: 'official' });
        const countriesList = Object.keys(nameObject).map((key) => ({
          id: key,
          name: nameObject[key],
          code: key,
        }));
        return {
          ...connectionFromArray(countriesList, args),
          totalCount: countriesList.length,
        };
      },
    });
  },
});

export const LocationEdge = objectType({
  name: 'LocationEdge',
  definition: (t) => {
    t.nonNull.field('node', { type: Location });
    t.nonNull.string('cursor');
  },
});
export const LocationConnection = objectType({
  name: 'LocationConnection',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: LocationEdge });
    t.nonNull.field('pageInfo', {
      type: PageInfo,
    });
    t.nonNull.int('totalCount');
  },
});
export const LocationQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('locations', {
      type: LocationConnection,
      args: PaginationConnectionArgs,
      resolve: async (_, args, { prisma, tenantId }) => {
        const baseArgs = { where: { tenantId } };
        const result = await findManyCursorConnection(
          (paginationArgs) => prisma.location.findMany({ ...baseArgs, ...paginationArgs }),
          () => prisma.location.count(baseArgs),
          args,
        );
        return result;
      },
    });
  },
});

export const AddLocationPayload = objectType({
  name: 'AddLocationPayload',
  definition: (t) => {
    t.nonNull.field('location', { type: Location });
  },
});
export const AddLocationInput = inputObjectType({
  name: 'AddLocationInput',
  definition: (t) => {
    t.nonNull.string('name');
    t.nonNull.string('countryId');
  },
});
export const AddLocationMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('addLocation', {
      type: AddLocationPayload,
      args: {
        input: nonNull(arg({ type: AddLocationInput })),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const { input } = args;
        const countryCode = fromGraphId('Country', input.countryId);
        if (!countries.isValid(countryCode)) {
          throw new Error('invalid countryId');
        }
        const countryName = countries.getName(countryCode, 'en', { select: 'official' });
        const location = await prisma.location.create({
          data: {
            tenantId,
            name: input.name,
            country: countryName,
          },
        });
        return {
          location,
        };
      },
    });
  },
});
