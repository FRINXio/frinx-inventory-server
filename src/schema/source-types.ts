import { blueprint, device, stream, label, location, uniconfigZone } from '@prisma/client';

export type Label = label;
export type Device = device;
export type Stream = stream;
export type Zone = uniconfigZone;
export type Location = location;
export type DataStore = {
  $deviceName: string;
  $uniconfigURL: string;
  $transactionId: string;
};
export type Country = {
  id: string;
  name: string;
  code: string;
};
export type Blueprint = blueprint;
