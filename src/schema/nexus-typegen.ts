/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */

import type * as SourceTypes from './source-types';
import type { Context } from './../context';
import type { core } from 'nexus';

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  AddBlueprintInput: {
    // input type
    name: string; // String!
    template: string; // String!
  };
  AddDeviceInput: {
    // input type
    address?: string | null; // String
    labelIds?: string[] | null; // [String!]
    model?: string | null; // String
    mountParameters?: string | null; // String
    name: string; // String!
    serviceState?: NexusGenEnums['DeviceServiceState'] | null; // DeviceServiceState
    vendor?: string | null; // String
    zoneId: string; // String!
  };
  AddLocationInput: {
    // input type
    countryId: string; // String!
    name: string; // String!
  };
  AddSnapshotInput: {
    // input type
    deviceId: string; // String!
    name: string; // String!
  };
  AddZoneInput: {
    // input type
    name: string; // String!
  };
  ApplySnapshotInput: {
    // input type
    deviceId: string; // String!
    name: string; // String!
  };
  CommitConfigInput: {
    // input type
    deviceId: string; // String!
    shouldDryRun?: boolean | null; // Boolean
  };
  CreateLabelInput: {
    // input type
    name: string; // String!
  };
  FilterDevicesInput: {
    // input type
    labelIds?: string[] | null; // [String!]
  };
  UpdateDataStoreInput: {
    // input type
    config: string; // String!
  };
  UpdateDeviceInput: {
    // input type
    address?: string | null; // String
    labelIds?: string[] | null; // [String!]
    locationId?: string | null; // String
    model?: string | null; // String
    mountParameters?: string | null; // String
    serviceState?: NexusGenEnums['DeviceServiceState'] | null; // DeviceServiceState
    vendor?: string | null; // String
  };
}

export interface NexusGenEnums {
  DeviceServiceState: 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'PLANNING';
  DeviceSource: 'DISCOVERED' | 'IMPORTED' | 'MANUAL';
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
}

export interface NexusGenObjects {
  AddBlueprintPayload: {
    // root type
    blueprint: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  AddDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  AddLocationPayload: {
    // root type
    location: NexusGenRootTypes['Location']; // Location!
  };
  AddSnapshotPayload: {
    // root type
    snapshot?: NexusGenRootTypes['Snapshot'] | null; // Snapshot
  };
  AddZonePayload: {
    // root type
    zone: NexusGenRootTypes['Zone']; // Zone!
  };
  ApplySnapshotPayload: {
    // root type
    isOk: boolean; // Boolean!
    output: string; // String!
  };
  Blueprint: SourceTypes.Blueprint;
  BlueprintConnection: {
    // root type
    edges: NexusGenRootTypes['BlueprintEdge'][]; // [BlueprintEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  BlueprintEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  CalculatedDiffPayload: {
    // root type
    output?: string | null; // String
  };
  CommitConfigPayload: {
    // root type
    isOk: boolean; // Boolean!
    output: string; // String!
  };
  Country: SourceTypes.Country;
  CountryConnection: {
    // root type
    edges: NexusGenRootTypes['CountryEdge'][]; // [CountryEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  CountryEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Country']; // Country!
  };
  CreateLabelPayload: {
    // root type
    label?: NexusGenRootTypes['Label'] | null; // Label
  };
  DataStore: SourceTypes.DataStore;
  DeleteDevicePayload: {
    // root type
    device?: NexusGenRootTypes['Device'] | null; // Device
  };
  DeleteLabelPayload: {
    // root type
    label?: NexusGenRootTypes['Label'] | null; // Label
  };
  Device: SourceTypes.Device;
  DeviceConnection: {
    // root type
    edges: NexusGenRootTypes['DeviceEdge'][]; // [DeviceEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  DeviceEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Device']; // Device!
  };
  InstallDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  Label: SourceTypes.Label;
  LabelConnection: {
    // root type
    edges: NexusGenRootTypes['LabelEdge'][]; // [LabelEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  LabelEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Label']; // Label!
  };
  Location: SourceTypes.Location;
  LocationConnection: {
    // root type
    edges: NexusGenRootTypes['LocationEdge'][]; // [LocationEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  LocationEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Location']; // Location!
  };
  Mutation: {};
  PageInfo: {
    // root type
    endCursor?: string | null; // String
    hasNextPage: boolean; // Boolean!
    hasPreviousPage: boolean; // Boolean!
    startCursor?: string | null; // String
  };
  Query: {};
  ResetConfigPayload: {
    // root type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  Snapshot: {
    // root type
    createdAt: string; // String!
    name: string; // String!
  };
  SyncFromNetworkPayload: {
    // root type
    dataStore?: NexusGenRootTypes['DataStore'] | null; // DataStore
  };
  UninstallDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateDataStorePayload: {
    // root type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  UpdateDevicePayload: {
    // root type
    device?: NexusGenRootTypes['Device'] | null; // Device
  };
  Zone: SourceTypes.Zone;
  ZoneEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Zone']; // Zone!
  };
  ZonesConnection: {
    // root type
    edges: NexusGenRootTypes['ZoneEdge'][]; // [ZoneEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
}

export interface NexusGenInterfaces {
  Node:
    | core.Discriminate<'Blueprint', 'required'>
    | core.Discriminate<'Country', 'required'>
    | core.Discriminate<'Device', 'required'>
    | core.Discriminate<'Label', 'required'>
    | core.Discriminate<'Location', 'required'>
    | core.Discriminate<'Zone', 'required'>;
}

export interface NexusGenUnions {}

export type NexusGenRootTypes = NexusGenInterfaces & NexusGenObjects;

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums;

export interface NexusGenFieldTypes {
  AddBlueprintPayload: {
    // field return type
    blueprint: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  AddDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  AddLocationPayload: {
    // field return type
    location: NexusGenRootTypes['Location']; // Location!
  };
  AddSnapshotPayload: {
    // field return type
    snapshot: NexusGenRootTypes['Snapshot'] | null; // Snapshot
  };
  AddZonePayload: {
    // field return type
    zone: NexusGenRootTypes['Zone']; // Zone!
  };
  ApplySnapshotPayload: {
    // field return type
    isOk: boolean; // Boolean!
    output: string; // String!
  };
  Blueprint: {
    // field return type
    createdAt: string; // String!
    id: string; // ID!
    name: string; // String!
    template: string; // String!
    updatedAt: string; // String!
  };
  BlueprintConnection: {
    // field return type
    edges: NexusGenRootTypes['BlueprintEdge'][]; // [BlueprintEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  BlueprintEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  CalculatedDiffPayload: {
    // field return type
    output: string | null; // String
  };
  CommitConfigPayload: {
    // field return type
    isOk: boolean; // Boolean!
    output: string; // String!
  };
  Country: {
    // field return type
    code: string; // String!
    id: string; // ID!
    name: string; // String!
  };
  CountryConnection: {
    // field return type
    edges: NexusGenRootTypes['CountryEdge'][]; // [CountryEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  CountryEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Country']; // Country!
  };
  CreateLabelPayload: {
    // field return type
    label: NexusGenRootTypes['Label'] | null; // Label
  };
  DataStore: {
    // field return type
    config: string | null; // String
    operational: string | null; // String
    snapshots: NexusGenRootTypes['Snapshot'][]; // [Snapshot!]!
  };
  DeleteDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device'] | null; // Device
  };
  DeleteLabelPayload: {
    // field return type
    label: NexusGenRootTypes['Label'] | null; // Label
  };
  Device: {
    // field return type
    address: string | null; // String
    createdAt: string; // String!
    id: string; // ID!
    isInstalled: boolean; // Boolean!
    labels: NexusGenRootTypes['LabelConnection']; // LabelConnection!
    location: NexusGenRootTypes['Location'] | null; // Location
    model: string | null; // String
    name: string; // String!
    serviceState: NexusGenEnums['DeviceServiceState']; // DeviceServiceState!
    source: NexusGenEnums['DeviceSource']; // DeviceSource!
    updatedAt: string; // String!
    vendor: string | null; // String
    zone: NexusGenRootTypes['Zone']; // Zone!
  };
  DeviceConnection: {
    // field return type
    edges: NexusGenRootTypes['DeviceEdge'][]; // [DeviceEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  DeviceEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Device']; // Device!
  };
  InstallDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  Label: {
    // field return type
    createdAt: string; // String!
    id: string; // ID!
    name: string; // String!
    updatedAt: string; // String!
  };
  LabelConnection: {
    // field return type
    edges: NexusGenRootTypes['LabelEdge'][]; // [LabelEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  LabelEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Label']; // Label!
  };
  Location: {
    // field return type
    country: string; // String!
    createdAt: string; // String!
    id: string; // ID!
    name: string; // String!
    updatedAt: string; // String!
  };
  LocationConnection: {
    // field return type
    edges: NexusGenRootTypes['LocationEdge'][]; // [LocationEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  LocationEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Location']; // Location!
  };
  Mutation: {
    // field return type
    addBlueprint: NexusGenRootTypes['AddBlueprintPayload']; // AddBlueprintPayload!
    addDevice: NexusGenRootTypes['AddDevicePayload']; // AddDevicePayload!
    addLocation: NexusGenRootTypes['AddLocationPayload']; // AddLocationPayload!
    addSnapshot: NexusGenRootTypes['AddSnapshotPayload'] | null; // AddSnapshotPayload
    addZone: NexusGenRootTypes['AddZonePayload']; // AddZonePayload!
    applySnapshot: NexusGenRootTypes['ApplySnapshotPayload']; // ApplySnapshotPayload!
    commitConfig: NexusGenRootTypes['CommitConfigPayload']; // CommitConfigPayload!
    createLabel: NexusGenRootTypes['CreateLabelPayload']; // CreateLabelPayload!
    deleteDevice: NexusGenRootTypes['DeleteDevicePayload']; // DeleteDevicePayload!
    deleteLabel: NexusGenRootTypes['DeleteLabelPayload']; // DeleteLabelPayload!
    installDevice: NexusGenRootTypes['InstallDevicePayload']; // InstallDevicePayload!
    resetConfig: NexusGenRootTypes['ResetConfigPayload']; // ResetConfigPayload!
    syncFromNetwork: NexusGenRootTypes['SyncFromNetworkPayload']; // SyncFromNetworkPayload!
    uninstallDevice: NexusGenRootTypes['UninstallDevicePayload']; // UninstallDevicePayload!
    updateDataStore: NexusGenRootTypes['UpdateDataStorePayload']; // UpdateDataStorePayload!
    updateDevice: NexusGenRootTypes['UpdateDevicePayload']; // UpdateDevicePayload!
  };
  PageInfo: {
    // field return type
    endCursor: string | null; // String
    hasNextPage: boolean; // Boolean!
    hasPreviousPage: boolean; // Boolean!
    startCursor: string | null; // String
  };
  Query: {
    // field return type
    blueprints: NexusGenRootTypes['BlueprintConnection']; // BlueprintConnection!
    calculatedDiff: NexusGenRootTypes['CalculatedDiffPayload']; // CalculatedDiffPayload!
    countries: NexusGenRootTypes['CountryConnection']; // CountryConnection!
    dataStore: NexusGenRootTypes['DataStore'] | null; // DataStore
    devices: NexusGenRootTypes['DeviceConnection']; // DeviceConnection!
    labels: NexusGenRootTypes['LabelConnection']; // LabelConnection!
    locations: NexusGenRootTypes['LocationConnection']; // LocationConnection!
    node: NexusGenRootTypes['Node'] | null; // Node
    zones: NexusGenRootTypes['ZonesConnection']; // ZonesConnection!
  };
  ResetConfigPayload: {
    // field return type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  Snapshot: {
    // field return type
    createdAt: string; // String!
    name: string; // String!
  };
  SyncFromNetworkPayload: {
    // field return type
    dataStore: NexusGenRootTypes['DataStore'] | null; // DataStore
  };
  UninstallDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateDataStorePayload: {
    // field return type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  UpdateDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device'] | null; // Device
  };
  Zone: {
    // field return type
    createdAt: string; // String!
    id: string; // ID!
    name: string; // String!
    updatedAt: string; // String!
  };
  ZoneEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Zone']; // Zone!
  };
  ZonesConnection: {
    // field return type
    edges: NexusGenRootTypes['ZoneEdge'][]; // [ZoneEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
    totalCount: number; // Int!
  };
  Node: {
    // field return type
    id: string; // ID!
  };
}

export interface NexusGenFieldTypeNames {
  AddBlueprintPayload: {
    // field return type name
    blueprint: 'Blueprint';
  };
  AddDevicePayload: {
    // field return type name
    device: 'Device';
  };
  AddLocationPayload: {
    // field return type name
    location: 'Location';
  };
  AddSnapshotPayload: {
    // field return type name
    snapshot: 'Snapshot';
  };
  AddZonePayload: {
    // field return type name
    zone: 'Zone';
  };
  ApplySnapshotPayload: {
    // field return type name
    isOk: 'Boolean';
    output: 'String';
  };
  Blueprint: {
    // field return type name
    createdAt: 'String';
    id: 'ID';
    name: 'String';
    template: 'String';
    updatedAt: 'String';
  };
  BlueprintConnection: {
    // field return type name
    edges: 'BlueprintEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  BlueprintEdge: {
    // field return type name
    cursor: 'String';
    node: 'Blueprint';
  };
  CalculatedDiffPayload: {
    // field return type name
    output: 'String';
  };
  CommitConfigPayload: {
    // field return type name
    isOk: 'Boolean';
    output: 'String';
  };
  Country: {
    // field return type name
    code: 'String';
    id: 'ID';
    name: 'String';
  };
  CountryConnection: {
    // field return type name
    edges: 'CountryEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  CountryEdge: {
    // field return type name
    cursor: 'String';
    node: 'Country';
  };
  CreateLabelPayload: {
    // field return type name
    label: 'Label';
  };
  DataStore: {
    // field return type name
    config: 'String';
    operational: 'String';
    snapshots: 'Snapshot';
  };
  DeleteDevicePayload: {
    // field return type name
    device: 'Device';
  };
  DeleteLabelPayload: {
    // field return type name
    label: 'Label';
  };
  Device: {
    // field return type name
    address: 'String';
    createdAt: 'String';
    id: 'ID';
    isInstalled: 'Boolean';
    labels: 'LabelConnection';
    location: 'Location';
    model: 'String';
    name: 'String';
    serviceState: 'DeviceServiceState';
    source: 'DeviceSource';
    updatedAt: 'String';
    vendor: 'String';
    zone: 'Zone';
  };
  DeviceConnection: {
    // field return type name
    edges: 'DeviceEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  DeviceEdge: {
    // field return type name
    cursor: 'String';
    node: 'Device';
  };
  InstallDevicePayload: {
    // field return type name
    device: 'Device';
  };
  Label: {
    // field return type name
    createdAt: 'String';
    id: 'ID';
    name: 'String';
    updatedAt: 'String';
  };
  LabelConnection: {
    // field return type name
    edges: 'LabelEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  LabelEdge: {
    // field return type name
    cursor: 'String';
    node: 'Label';
  };
  Location: {
    // field return type name
    country: 'String';
    createdAt: 'String';
    id: 'ID';
    name: 'String';
    updatedAt: 'String';
  };
  LocationConnection: {
    // field return type name
    edges: 'LocationEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  LocationEdge: {
    // field return type name
    cursor: 'String';
    node: 'Location';
  };
  Mutation: {
    // field return type name
    addBlueprint: 'AddBlueprintPayload';
    addDevice: 'AddDevicePayload';
    addLocation: 'AddLocationPayload';
    addSnapshot: 'AddSnapshotPayload';
    addZone: 'AddZonePayload';
    applySnapshot: 'ApplySnapshotPayload';
    commitConfig: 'CommitConfigPayload';
    createLabel: 'CreateLabelPayload';
    deleteDevice: 'DeleteDevicePayload';
    deleteLabel: 'DeleteLabelPayload';
    installDevice: 'InstallDevicePayload';
    resetConfig: 'ResetConfigPayload';
    syncFromNetwork: 'SyncFromNetworkPayload';
    uninstallDevice: 'UninstallDevicePayload';
    updateDataStore: 'UpdateDataStorePayload';
    updateDevice: 'UpdateDevicePayload';
  };
  PageInfo: {
    // field return type name
    endCursor: 'String';
    hasNextPage: 'Boolean';
    hasPreviousPage: 'Boolean';
    startCursor: 'String';
  };
  Query: {
    // field return type name
    blueprints: 'BlueprintConnection';
    calculatedDiff: 'CalculatedDiffPayload';
    countries: 'CountryConnection';
    dataStore: 'DataStore';
    devices: 'DeviceConnection';
    labels: 'LabelConnection';
    locations: 'LocationConnection';
    node: 'Node';
    zones: 'ZonesConnection';
  };
  ResetConfigPayload: {
    // field return type name
    dataStore: 'DataStore';
  };
  Snapshot: {
    // field return type name
    createdAt: 'String';
    name: 'String';
  };
  SyncFromNetworkPayload: {
    // field return type name
    dataStore: 'DataStore';
  };
  UninstallDevicePayload: {
    // field return type name
    device: 'Device';
  };
  UpdateDataStorePayload: {
    // field return type name
    dataStore: 'DataStore';
  };
  UpdateDevicePayload: {
    // field return type name
    device: 'Device';
  };
  Zone: {
    // field return type name
    createdAt: 'String';
    id: 'ID';
    name: 'String';
    updatedAt: 'String';
  };
  ZoneEdge: {
    // field return type name
    cursor: 'String';
    node: 'Zone';
  };
  ZonesConnection: {
    // field return type name
    edges: 'ZoneEdge';
    pageInfo: 'PageInfo';
    totalCount: 'Int';
  };
  Node: {
    // field return type name
    id: 'ID';
  };
}

export interface NexusGenArgTypes {
  Device: {
    labels: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
  };
  Mutation: {
    addBlueprint: {
      // args
      input: NexusGenInputs['AddBlueprintInput']; // AddBlueprintInput!
    };
    addDevice: {
      // args
      input: NexusGenInputs['AddDeviceInput']; // AddDeviceInput!
    };
    addLocation: {
      // args
      input: NexusGenInputs['AddLocationInput']; // AddLocationInput!
    };
    addSnapshot: {
      // args
      input: NexusGenInputs['AddSnapshotInput']; // AddSnapshotInput!
    };
    addZone: {
      // args
      input: NexusGenInputs['AddZoneInput']; // AddZoneInput!
    };
    applySnapshot: {
      // args
      input: NexusGenInputs['ApplySnapshotInput']; // ApplySnapshotInput!
    };
    commitConfig: {
      // args
      input: NexusGenInputs['CommitConfigInput']; // CommitConfigInput!
    };
    createLabel: {
      // args
      input: NexusGenInputs['CreateLabelInput']; // CreateLabelInput!
    };
    deleteDevice: {
      // args
      id: string; // String!
    };
    deleteLabel: {
      // args
      id: string; // String!
    };
    installDevice: {
      // args
      id: string; // String!
    };
    resetConfig: {
      // args
      deviceId: string; // String!
    };
    syncFromNetwork: {
      // args
      deviceId: string; // String!
    };
    uninstallDevice: {
      // args
      id: string; // String!
    };
    updateDataStore: {
      // args
      deviceId: string; // String!
      input: NexusGenInputs['UpdateDataStoreInput']; // UpdateDataStoreInput!
    };
    updateDevice: {
      // args
      id: string; // String!
      input: NexusGenInputs['UpdateDeviceInput']; // UpdateDeviceInput!
    };
  };
  Query: {
    blueprints: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
    calculatedDiff: {
      // args
      deviceId: string; // String!
    };
    countries: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
    dataStore: {
      // args
      deviceId: string; // String!
    };
    devices: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      filter?: NexusGenInputs['FilterDevicesInput'] | null; // FilterDevicesInput
      first?: number | null; // Int
      last?: number | null; // Int
    };
    labels: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
    locations: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
    node: {
      // args
      id: string; // ID!
    };
    zones: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      first?: number | null; // Int
      last?: number | null; // Int
    };
  };
}

export interface NexusGenAbstractTypeMembers {
  Node: 'Blueprint' | 'Country' | 'Device' | 'Label' | 'Location' | 'Zone';
}

export interface NexusGenTypeInterfaces {
  Blueprint: 'Node';
  Country: 'Node';
  Device: 'Node';
  Label: 'Node';
  Location: 'Node';
  Zone: 'Node';
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = keyof NexusGenInputs;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = keyof NexusGenInterfaces;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    __typename: true;
    isTypeOf: false;
    resolveType: false;
  };
};

export interface NexusGenTypes {
  context: Context;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes:
    | NexusGenTypes['objectNames']
    | NexusGenTypes['enumNames']
    | NexusGenTypes['unionNames']
    | NexusGenTypes['interfaceNames']
    | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes'];
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}

declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {}
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {}
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {}
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {}
  interface NexusGenPluginSchemaConfig {}
  interface NexusGenPluginArgConfig {}
}
