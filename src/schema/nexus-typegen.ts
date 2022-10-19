/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */

import type * as SourceTypes from './source-types';
import type { Context } from './../context';
import type { core } from 'nexus';
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * The `Upload` scalar type represents a file upload.
     */
    upload<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "Upload";
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * The `Upload` scalar type represents a file upload.
     */
    upload<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void; // "Upload";
  }
}

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
    blueprintId?: string | null; // String
    deviceSize?: NexusGenEnums['DeviceSize'] | null; // DeviceSize
    deviceType?: string | null; // String
    labelIds?: string[] | null; // [String!]
    model?: string | null; // String
    mountParameters?: string | null; // String
    name: string; // String!
    password?: string | null; // String
    port?: number | null; // Int
    serviceState?: NexusGenEnums['DeviceServiceState'] | null; // DeviceServiceState
    username?: string | null; // String
    vendor?: string | null; // String
    version?: string | null; // String
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
  CSVImportInput: {
    // input type
    file: NexusGenScalars['Upload']; // Upload!
    zoneId: string; // String!
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
  DeleteSnapshotInput: {
    // input type
    deviceId: string; // String!
    name: string; // String!
    transactionId: string; // String!
  };
  DeviceOrderByInput: {
    // input type
    direction: NexusGenEnums['SortDirection']; // SortDirection!
    sortKey: NexusGenEnums['SortDeviceBy']; // SortDeviceBy!
  };
  FilterDevicesInput: {
    // input type
    deviceName?: string | null; // String
    labels?: string[] | null; // [String!]
  };
  FilterTopologyInput: {
    // input type
    labels?: string[] | null; // [String!]
  };
  PositionInput: {
    // input type
    deviceId: string; // ID!
    position: NexusGenInputs['PositionInputField']; // PositionInputField!
  };
  PositionInputField: {
    // input type
    x: number; // Float!
    y: number; // Float!
  };
  UpdateBlueprintInput: {
    // input type
    name?: string | null; // String
    template?: string | null; // String
  };
  UpdateDataStoreInput: {
    // input type
    config: string; // String!
  };
  UpdateDeviceInput: {
    // input type
    address?: string | null; // String
    blueprintId?: string | null; // String
    deviceSize?: NexusGenEnums['DeviceSize'] | null; // DeviceSize
    deviceType?: string | null; // String
    labelIds?: string[] | null; // [String!]
    locationId?: string | null; // String
    model?: string | null; // String
    mountParameters?: string | null; // String
    password?: string | null; // String
    port?: number | null; // Int
    serviceState?: NexusGenEnums['DeviceServiceState'] | null; // DeviceServiceState
    username?: string | null; // String
    vendor?: string | null; // String
    version?: string | null; // String
  };
}

export interface NexusGenEnums {
  DeviceServiceState: 'IN_SERVICE' | 'OUT_OF_SERVICE' | 'PLANNING';
  DeviceSize: 'LARGE' | 'MEDIUM' | 'SMALL';
  DeviceSource: 'DISCOVERED' | 'IMPORTED' | 'MANUAL';
  SortDeviceBy: 'CREATED_AT' | 'NAME';
  SortDirection: 'ASC' | 'DESC';
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  Upload: any;
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
  CSVImport: {
    // root type
    isOk?: boolean | null; // Boolean
  };
  CalculatedDiffPayload: {
    // root type
    result: NexusGenRootTypes['CalculatedDiffResult']; // CalculatedDiffResult!
  };
  CalculatedDiffResult: {
    // root type
    createdData: NexusGenRootTypes['DiffData'][]; // [DiffData!]!
    deletedData: NexusGenRootTypes['DiffData'][]; // [DiffData!]!
    updatedData: NexusGenRootTypes['CalculatedUpdateDiffData'][]; // [CalculatedUpdateDiffData!]!
  };
  CalculatedUpdateDiffData: {
    // root type
    actualData: string; // String!
    intendedData: string; // String!
    path: string; // String!
  };
  CloseTransactionPayload: {
    // root type
    isOk: boolean; // Boolean!
  };
  CommitConfigOutput: {
    // root type
    configuration?: string | null; // String
    deviceId: string; // String!
    message?: string | null; // String
  };
  CommitConfigPayload: {
    // root type
    output: NexusGenRootTypes['CommitConfigOutput']; // CommitConfigOutput!
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
  CreateTransactionPayload: {
    // root type
    transactionId?: string | null; // String
  };
  DataStore: SourceTypes.DataStore;
  DeleteBlueprintPayload: {
    // root type
    blueprint?: NexusGenRootTypes['Blueprint'] | null; // Blueprint
  };
  DeleteDevicePayload: {
    // root type
    device?: NexusGenRootTypes['Device'] | null; // Device
  };
  DeleteLabelPayload: {
    // root type
    label?: NexusGenRootTypes['Label'] | null; // Label
  };
  DeleteSnapshotPayload: {
    // root type
    snapshot?: NexusGenRootTypes['Snapshot'] | null; // Snapshot
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
  DiffData: {
    // root type
    data: string; // String!
    path: string; // String!
  };
  EdgeSourceTarget: {
    // root type
    interface: string; // String!
    nodeId: string; // String!
  };
  GraphEdge: {
    // root type
    id: string; // ID!
    source: NexusGenRootTypes['EdgeSourceTarget']; // EdgeSourceTarget!
    target: NexusGenRootTypes['EdgeSourceTarget']; // EdgeSourceTarget!
  };
  GraphNode: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
    id: string; // ID!
    interfaces: string[]; // [String!]!
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
  Position: {
    // root type
    x: number; // Float!
    y: number; // Float!
  };
  Query: {};
  ResetConfigPayload: {
    // root type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  RevertChangesPayload: {
    // root type
    isOk: boolean; // Boolean!
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
  Topology: {
    // root type
    edges: NexusGenRootTypes['GraphEdge'][]; // [GraphEdge!]!
    nodes: NexusGenRootTypes['GraphNode'][]; // [GraphNode!]!
  };
  Transaction: {
    // root type
    changes: NexusGenRootTypes['TransactionChange'][]; // [TransactionChange!]!
    lastCommitTime: string; // String!
    transactionId: string; // String!
  };
  TransactionChange: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
    diff: NexusGenRootTypes['TransactionDiff'][]; // [TransactionDiff!]!
  };
  TransactionDiff: {
    // root type
    dataAfter?: string | null; // String
    dataBefore?: string | null; // String
    path: string; // String!
  };
  UninstallDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateBlueprintPayload: {
    // root type
    blueprint: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  UpdateDataStorePayload: {
    // root type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  UpdateDeviceMetadataPayload: {
    // root type
    devices?: Array<NexusGenRootTypes['Device'] | null> | null; // [Device]
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
  CSVImport: {
    // field return type
    isOk: boolean | null; // Boolean
  };
  CalculatedDiffPayload: {
    // field return type
    result: NexusGenRootTypes['CalculatedDiffResult']; // CalculatedDiffResult!
  };
  CalculatedDiffResult: {
    // field return type
    createdData: NexusGenRootTypes['DiffData'][]; // [DiffData!]!
    deletedData: NexusGenRootTypes['DiffData'][]; // [DiffData!]!
    updatedData: NexusGenRootTypes['CalculatedUpdateDiffData'][]; // [CalculatedUpdateDiffData!]!
  };
  CalculatedUpdateDiffData: {
    // field return type
    actualData: string; // String!
    intendedData: string; // String!
    path: string; // String!
  };
  CloseTransactionPayload: {
    // field return type
    isOk: boolean; // Boolean!
  };
  CommitConfigOutput: {
    // field return type
    configuration: string | null; // String
    deviceId: string; // String!
    message: string | null; // String
  };
  CommitConfigPayload: {
    // field return type
    output: NexusGenRootTypes['CommitConfigOutput']; // CommitConfigOutput!
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
  CreateTransactionPayload: {
    // field return type
    transactionId: string | null; // String
  };
  DataStore: {
    // field return type
    config: string; // String!
    operational: string; // String!
    snapshots: NexusGenRootTypes['Snapshot'][]; // [Snapshot!]!
  };
  DeleteBlueprintPayload: {
    // field return type
    blueprint: NexusGenRootTypes['Blueprint'] | null; // Blueprint
  };
  DeleteDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device'] | null; // Device
  };
  DeleteLabelPayload: {
    // field return type
    label: NexusGenRootTypes['Label'] | null; // Label
  };
  DeleteSnapshotPayload: {
    // field return type
    snapshot: NexusGenRootTypes['Snapshot'] | null; // Snapshot
  };
  Device: {
    // field return type
    address: string | null; // String
    blueprint: NexusGenRootTypes['Blueprint'] | null; // Blueprint
    createdAt: string; // String!
    deviceSize: NexusGenEnums['DeviceSize']; // DeviceSize!
    id: string; // ID!
    isInstalled: boolean; // Boolean!
    labels: NexusGenRootTypes['LabelConnection']; // LabelConnection!
    location: NexusGenRootTypes['Location'] | null; // Location
    model: string | null; // String
    mountParameters: string | null; // String
    name: string; // String!
    position: NexusGenRootTypes['Position'] | null; // Position
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
  DiffData: {
    // field return type
    data: string; // String!
    path: string; // String!
  };
  EdgeSourceTarget: {
    // field return type
    interface: string; // String!
    nodeId: string; // String!
  };
  GraphEdge: {
    // field return type
    id: string; // ID!
    source: NexusGenRootTypes['EdgeSourceTarget']; // EdgeSourceTarget!
    target: NexusGenRootTypes['EdgeSourceTarget']; // EdgeSourceTarget!
  };
  GraphNode: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
    id: string; // ID!
    interfaces: string[]; // [String!]!
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
    closeTransaction: NexusGenRootTypes['CloseTransactionPayload']; // CloseTransactionPayload!
    commitConfig: NexusGenRootTypes['CommitConfigPayload']; // CommitConfigPayload!
    createLabel: NexusGenRootTypes['CreateLabelPayload']; // CreateLabelPayload!
    createTransaction: NexusGenRootTypes['CreateTransactionPayload']; // CreateTransactionPayload!
    deleteBlueprint: NexusGenRootTypes['DeleteBlueprintPayload']; // DeleteBlueprintPayload!
    deleteDevice: NexusGenRootTypes['DeleteDevicePayload']; // DeleteDevicePayload!
    deleteLabel: NexusGenRootTypes['DeleteLabelPayload']; // DeleteLabelPayload!
    deleteSnapshot: NexusGenRootTypes['DeleteSnapshotPayload'] | null; // DeleteSnapshotPayload
    importCSV: NexusGenRootTypes['CSVImport'] | null; // CSVImport
    installDevice: NexusGenRootTypes['InstallDevicePayload']; // InstallDevicePayload!
    resetConfig: NexusGenRootTypes['ResetConfigPayload']; // ResetConfigPayload!
    revertChanges: NexusGenRootTypes['RevertChangesPayload']; // RevertChangesPayload!
    syncFromNetwork: NexusGenRootTypes['SyncFromNetworkPayload']; // SyncFromNetworkPayload!
    uninstallDevice: NexusGenRootTypes['UninstallDevicePayload']; // UninstallDevicePayload!
    updateBlueprint: NexusGenRootTypes['UpdateBlueprintPayload']; // UpdateBlueprintPayload!
    updateDataStore: NexusGenRootTypes['UpdateDataStorePayload']; // UpdateDataStorePayload!
    updateDevice: NexusGenRootTypes['UpdateDevicePayload']; // UpdateDevicePayload!
    updateDeviceMetadata: NexusGenRootTypes['UpdateDeviceMetadataPayload']; // UpdateDeviceMetadataPayload!
  };
  PageInfo: {
    // field return type
    endCursor: string | null; // String
    hasNextPage: boolean; // Boolean!
    hasPreviousPage: boolean; // Boolean!
    startCursor: string | null; // String
  };
  Position: {
    // field return type
    x: number; // Float!
    y: number; // Float!
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
    topology: NexusGenRootTypes['Topology']; // Topology!
    transactions: NexusGenRootTypes['Transaction'][]; // [Transaction!]!
    zones: NexusGenRootTypes['ZonesConnection']; // ZonesConnection!
  };
  ResetConfigPayload: {
    // field return type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  RevertChangesPayload: {
    // field return type
    isOk: boolean; // Boolean!
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
  Topology: {
    // field return type
    edges: NexusGenRootTypes['GraphEdge'][]; // [GraphEdge!]!
    nodes: NexusGenRootTypes['GraphNode'][]; // [GraphNode!]!
  };
  Transaction: {
    // field return type
    changes: NexusGenRootTypes['TransactionChange'][]; // [TransactionChange!]!
    lastCommitTime: string; // String!
    transactionId: string; // String!
  };
  TransactionChange: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
    diff: NexusGenRootTypes['TransactionDiff'][]; // [TransactionDiff!]!
  };
  TransactionDiff: {
    // field return type
    dataAfter: string | null; // String
    dataBefore: string | null; // String
    path: string; // String!
  };
  UninstallDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateBlueprintPayload: {
    // field return type
    blueprint: NexusGenRootTypes['Blueprint']; // Blueprint!
  };
  UpdateDataStorePayload: {
    // field return type
    dataStore: NexusGenRootTypes['DataStore']; // DataStore!
  };
  UpdateDeviceMetadataPayload: {
    // field return type
    devices: Array<NexusGenRootTypes['Device'] | null> | null; // [Device]
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
  CSVImport: {
    // field return type name
    isOk: 'Boolean';
  };
  CalculatedDiffPayload: {
    // field return type name
    result: 'CalculatedDiffResult';
  };
  CalculatedDiffResult: {
    // field return type name
    createdData: 'DiffData';
    deletedData: 'DiffData';
    updatedData: 'CalculatedUpdateDiffData';
  };
  CalculatedUpdateDiffData: {
    // field return type name
    actualData: 'String';
    intendedData: 'String';
    path: 'String';
  };
  CloseTransactionPayload: {
    // field return type name
    isOk: 'Boolean';
  };
  CommitConfigOutput: {
    // field return type name
    configuration: 'String';
    deviceId: 'String';
    message: 'String';
  };
  CommitConfigPayload: {
    // field return type name
    output: 'CommitConfigOutput';
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
  CreateTransactionPayload: {
    // field return type name
    transactionId: 'String';
  };
  DataStore: {
    // field return type name
    config: 'String';
    operational: 'String';
    snapshots: 'Snapshot';
  };
  DeleteBlueprintPayload: {
    // field return type name
    blueprint: 'Blueprint';
  };
  DeleteDevicePayload: {
    // field return type name
    device: 'Device';
  };
  DeleteLabelPayload: {
    // field return type name
    label: 'Label';
  };
  DeleteSnapshotPayload: {
    // field return type name
    snapshot: 'Snapshot';
  };
  Device: {
    // field return type name
    address: 'String';
    blueprint: 'Blueprint';
    createdAt: 'String';
    deviceSize: 'DeviceSize';
    id: 'ID';
    isInstalled: 'Boolean';
    labels: 'LabelConnection';
    location: 'Location';
    model: 'String';
    mountParameters: 'String';
    name: 'String';
    position: 'Position';
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
  DiffData: {
    // field return type name
    data: 'String';
    path: 'String';
  };
  EdgeSourceTarget: {
    // field return type name
    interface: 'String';
    nodeId: 'String';
  };
  GraphEdge: {
    // field return type name
    id: 'ID';
    source: 'EdgeSourceTarget';
    target: 'EdgeSourceTarget';
  };
  GraphNode: {
    // field return type name
    device: 'Device';
    id: 'ID';
    interfaces: 'String';
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
    closeTransaction: 'CloseTransactionPayload';
    commitConfig: 'CommitConfigPayload';
    createLabel: 'CreateLabelPayload';
    createTransaction: 'CreateTransactionPayload';
    deleteBlueprint: 'DeleteBlueprintPayload';
    deleteDevice: 'DeleteDevicePayload';
    deleteLabel: 'DeleteLabelPayload';
    deleteSnapshot: 'DeleteSnapshotPayload';
    importCSV: 'CSVImport';
    installDevice: 'InstallDevicePayload';
    resetConfig: 'ResetConfigPayload';
    revertChanges: 'RevertChangesPayload';
    syncFromNetwork: 'SyncFromNetworkPayload';
    uninstallDevice: 'UninstallDevicePayload';
    updateBlueprint: 'UpdateBlueprintPayload';
    updateDataStore: 'UpdateDataStorePayload';
    updateDevice: 'UpdateDevicePayload';
    updateDeviceMetadata: 'UpdateDeviceMetadataPayload';
  };
  PageInfo: {
    // field return type name
    endCursor: 'String';
    hasNextPage: 'Boolean';
    hasPreviousPage: 'Boolean';
    startCursor: 'String';
  };
  Position: {
    // field return type name
    x: 'Float';
    y: 'Float';
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
    topology: 'Topology';
    transactions: 'Transaction';
    zones: 'ZonesConnection';
  };
  ResetConfigPayload: {
    // field return type name
    dataStore: 'DataStore';
  };
  RevertChangesPayload: {
    // field return type name
    isOk: 'Boolean';
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
  Topology: {
    // field return type name
    edges: 'GraphEdge';
    nodes: 'GraphNode';
  };
  Transaction: {
    // field return type name
    changes: 'TransactionChange';
    lastCommitTime: 'String';
    transactionId: 'String';
  };
  TransactionChange: {
    // field return type name
    device: 'Device';
    diff: 'TransactionDiff';
  };
  TransactionDiff: {
    // field return type name
    dataAfter: 'String';
    dataBefore: 'String';
    path: 'String';
  };
  UninstallDevicePayload: {
    // field return type name
    device: 'Device';
  };
  UpdateBlueprintPayload: {
    // field return type name
    blueprint: 'Blueprint';
  };
  UpdateDataStorePayload: {
    // field return type name
    dataStore: 'DataStore';
  };
  UpdateDeviceMetadataPayload: {
    // field return type name
    devices: 'Device';
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
      transactionId: string; // String!
    };
    addZone: {
      // args
      input: NexusGenInputs['AddZoneInput']; // AddZoneInput!
    };
    applySnapshot: {
      // args
      input: NexusGenInputs['ApplySnapshotInput']; // ApplySnapshotInput!
      transactionId: string; // String!
    };
    closeTransaction: {
      // args
      deviceId: string; // String!
      transactionId: string; // String!
    };
    commitConfig: {
      // args
      input: NexusGenInputs['CommitConfigInput']; // CommitConfigInput!
      transactionId: string; // String!
    };
    createLabel: {
      // args
      input: NexusGenInputs['CreateLabelInput']; // CreateLabelInput!
    };
    createTransaction: {
      // args
      deviceId: string; // String!
    };
    deleteBlueprint: {
      // args
      id: string; // String!
    };
    deleteDevice: {
      // args
      id: string; // String!
    };
    deleteLabel: {
      // args
      id: string; // String!
    };
    deleteSnapshot: {
      // args
      input: NexusGenInputs['DeleteSnapshotInput']; // DeleteSnapshotInput!
    };
    importCSV: {
      // args
      input: NexusGenInputs['CSVImportInput']; // CSVImportInput!
    };
    installDevice: {
      // args
      id: string; // String!
    };
    resetConfig: {
      // args
      deviceId: string; // String!
      transactionId: string; // String!
    };
    revertChanges: {
      // args
      transactionId: string; // String!
    };
    syncFromNetwork: {
      // args
      deviceId: string; // String!
      transactionId: string; // String!
    };
    uninstallDevice: {
      // args
      id: string; // String!
    };
    updateBlueprint: {
      // args
      id: string; // String!
      input: NexusGenInputs['UpdateBlueprintInput']; // UpdateBlueprintInput!
    };
    updateDataStore: {
      // args
      deviceId: string; // String!
      input: NexusGenInputs['UpdateDataStoreInput']; // UpdateDataStoreInput!
      transactionId: string; // String!
    };
    updateDevice: {
      // args
      id: string; // String!
      input: NexusGenInputs['UpdateDeviceInput']; // UpdateDeviceInput!
    };
    updateDeviceMetadata: {
      // args
      input: NexusGenInputs['PositionInput'][]; // [PositionInput!]!
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
      transactionId: string; // String!
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
      transactionId: string; // String!
    };
    devices: {
      // args
      after?: string | null; // String
      before?: string | null; // String
      filter?: NexusGenInputs['FilterDevicesInput'] | null; // FilterDevicesInput
      first?: number | null; // Int
      last?: number | null; // Int
      orderBy?: NexusGenInputs['DeviceOrderByInput'] | null; // DeviceOrderByInput
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
    topology: {
      // args
      filter?: NexusGenInputs['FilterTopologyInput'] | null; // FilterTopologyInput
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
