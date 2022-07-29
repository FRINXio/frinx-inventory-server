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

export function CSVValuesToJSON(values: string[][]): Record<string, string>[] {
  return values.map((val) => ({
    nodeId: val[0],
    idAddress: val[1],
    portNumber: val[2],
    deviceType: val[3],
    version: val[4],
    user: val[5],
    password: val[6],
  }));
}
