import { device, label, location, uniconfigZone } from '@prisma/client';

export type Label = label;
export type Device = device;
export type Zone = uniconfigZone;
export type Location = location;
export type DataStore = {
  $deviceName: string;
  $uniconfigURL: string;
};
export type Country = {
  id: string;
  name: string;
  code: string;
};
