import countries from 'i18n-iso-countries';
import { fromGraphId } from './id-helper';

export function getCountryName(countryId: string | null): string | null {
  if (countryId) {
    const countryCode = fromGraphId('Country', countryId);
    if (!countries.isValid(countryCode)) {
      throw new Error('invalid countryId');
    }
    const countryName = countries.getName(countryCode, 'en', { select: 'official' });
    return countryName;
  }

  return null;
}

type FilterInput = {
  locationName?: string | null;
};

type FilterQuery = {
  name?: Record<string, unknown>;
};

type LocationOrderingInput = {
  sortKey: 'name';
  direction: 'ASC' | 'DESC';
};

function getLocationNameQuery(locationName?: string | null): Record<string, unknown> | undefined {
  return locationName ? { contains: locationName, mode: 'insensitive' } : undefined;
}

export function getLocationFilterQuery(filter?: FilterInput | null): FilterQuery | undefined {
  if (!filter) {
    return undefined;
  }
  const { locationName } = filter;
  return {
    name: getLocationNameQuery(locationName),
  };
}

export function getLocationOrderingQuery(ordering?: LocationOrderingInput | null): Record<string, unknown> | undefined {
  if (!ordering) {
    return undefined;
  }

  return {
    orderBy: [{ [ordering.sortKey]: ordering.direction.toLowerCase() }],
  };
}
