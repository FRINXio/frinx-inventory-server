import config from '../config';
import { sendGetRequest } from './helpers';
import { decodeUniconfigZonesOutput, UniconfigZonesOutput } from './network-types';

export async function getUniconfigZones(): Promise<UniconfigZonesOutput> {
  const json = await sendGetRequest([config.uniconfigListURL]);
  const data = decodeUniconfigZonesOutput(json);

  return data;
}
