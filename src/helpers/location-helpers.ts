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
