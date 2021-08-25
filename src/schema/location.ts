import { connectionFromArray } from 'graphql-relay';
import { arg, extendType, inputObjectType, intArg, nonNull, objectType, stringArg } from 'nexus';
import countries from 'i18n-iso-countries';
import { convertDBLocation } from '../helpers/converters';
import { Node, PageInfo } from './global-types';
import { fromGraphId, toGraphId } from '../helpers/id-helper';

export const Location = objectType({
  name: 'Location',
  definition: (t) => {
    t.implements(Node);
    t.nonNull.string('name');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
    t.nonNull.string('country');
  },
});

export const Country = objectType({
  name: 'Country',
  definition: (t) => {
    t.implements(Node);
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
  },
});
export const CountryQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('countries', {
      type: CountryConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: (_, args) => {
        const nameObject = countries.getNames('en', { select: 'official' });
        const countriesList = Object.keys(nameObject).map((key) => ({
          id: toGraphId('Country', key),
          name: nameObject[key],
          code: key,
        }));
        return connectionFromArray(countriesList, args);
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
  },
});
export const LocationQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('locations', {
      type: LocationConnection,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const dbLocations = await prisma.location.findMany({ where: { tenantId } });
        const locations = dbLocations.map(convertDBLocation);
        return connectionFromArray(locations, args);
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
        const dbLocation = await prisma.location.create({
          data: {
            tenantId,
            name: input.name,
            country: countryName,
          },
        });
        return {
          location: convertDBLocation(dbLocation),
        };
      },
    });
  },
});
