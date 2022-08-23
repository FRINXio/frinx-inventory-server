import { Parser } from 'csv-parse';
import { isEqual } from 'lodash';

export type CSVHeader = ['node_id', 'ip_address', 'port_number', 'device_type', 'version', 'user', 'password'];

const CSV_HEADER_VALUES: CSVHeader = [
  'node_id',
  'ip_address',
  'port_number',
  'device_type',
  'version',
  'user',
  'password',
];

export function isHeaderValid(value: Readonly<string[]>): value is CSVHeader {
  const [nodeId, ipAddress, portNumber, deviceType, version, user, password] = value;
  return isEqual([nodeId, ipAddress, portNumber, deviceType, version, user, password], CSV_HEADER_VALUES);
}

export async function CSVParserToPromise(parser: Parser): Promise<string[][]> {
  const result: string[][] = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const record of parser) {
    result.push(record);
  }
  return result;
}

/* eslint-disable @typescript-eslint/naming-convention */
export type JSONDevice = {
  node_id: string;
  ip_address: string;
  port_number: number;
  device_type: string;
  version: string;
  user: string;
  password: string;
};

export function CSVValuesToJSON(values: string[][]): JSONDevice[] {
  return values.map((val) => ({
    node_id: val[0],
    ip_address: val[1],
    port_number: Number(val[2]),
    device_type: val[3],
    version: val[4],
    user: val[5],
    password: val[6],
  }));
}
/* eslint-enable */
