/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */

import type { Context } from './../context';

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  AddDeviceInput: {
    // input type
    address?: string | null; // String
    model?: string | null; // String
    mountParameters?: string | null; // String
    name: string; // String!
    vendor?: string | null; // String
    zoneId: string; // String!
  };
  AddZoneInput: {
    // input type
    name: string; // String!
  };
  UpdateDeviceInput: {
    // input type
    address?: string | null; // String
    model?: string | null; // String
    mountParameters?: string | null; // String
    vendor?: string | null; // String
  };
}

export interface NexusGenEnums {
  DeviceStatus: 'INSTALLED' | 'NOT_INSTALLED';
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
}

export interface NexusGenObjects {
  AddDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  AddZonePayload: {
    // root type
    zone: NexusGenRootTypes['Zone']; // Zone!
  };
  DataStore: {
    // root type
    config?: string | null; // String
    operational?: string | null; // String
  };
  DeleteDevicePayload: {
    // root type
    device?: NexusGenRootTypes['Device'] | null; // Device
  };
  Device: {
    // root type
    address?: string | null; // String
    id: string; // ID!
    model?: string | null; // String
    name: string; // String!
    vendor?: string | null; // String
  };
  DeviceEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Device']; // Device!
  };
  DevicesConnection: {
    // root type
    edges: NexusGenRootTypes['DeviceEdge'][]; // [DeviceEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  };
  InstallDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
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
  UninstallDevicePayload: {
    // root type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateDevicePayload: {
    // root type
    device?: NexusGenRootTypes['Device'] | null; // Device
  };
  Zone: {
    // root type
    id: string; // ID!
    name: string; // String!
  };
  ZoneEdge: {
    // root type
    cursor: string; // String!
    node: NexusGenRootTypes['Zone']; // Zone!
  };
  ZonesConnection: {
    // root type
    edges: NexusGenRootTypes['ZoneEdge'][]; // [ZoneEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  };
}

export interface NexusGenInterfaces {
  Node: NexusGenRootTypes['Device'] | NexusGenRootTypes['Zone'];
}

export interface NexusGenUnions {}

export type NexusGenRootTypes = NexusGenInterfaces & NexusGenObjects;

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums;

export interface NexusGenFieldTypes {
  AddDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  AddZonePayload: {
    // field return type
    zone: NexusGenRootTypes['Zone']; // Zone!
  };
  DataStore: {
    // field return type
    config: string | null; // String
    operational: string | null; // String
  };
  DeleteDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device'] | null; // Device
  };
  Device: {
    // field return type
    address: string | null; // String
    id: string; // ID!
    model: string | null; // String
    name: string; // String!
    status: NexusGenEnums['DeviceStatus'] | null; // DeviceStatus
    vendor: string | null; // String
    zone: NexusGenRootTypes['Zone'] | null; // Zone
  };
  DeviceEdge: {
    // field return type
    cursor: string; // String!
    node: NexusGenRootTypes['Device']; // Device!
  };
  DevicesConnection: {
    // field return type
    edges: NexusGenRootTypes['DeviceEdge'][]; // [DeviceEdge!]!
    pageInfo: NexusGenRootTypes['PageInfo']; // PageInfo!
  };
  InstallDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  Mutation: {
    // field return type
    addDevice: NexusGenRootTypes['AddDevicePayload']; // AddDevicePayload!
    addZone: NexusGenRootTypes['AddZonePayload']; // AddZonePayload!
    deleteDevice: NexusGenRootTypes['DeleteDevicePayload']; // DeleteDevicePayload!
    installDevice: NexusGenRootTypes['InstallDevicePayload']; // InstallDevicePayload!
    uninstallDevice: NexusGenRootTypes['UninstallDevicePayload']; // UninstallDevicePayload!
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
    dataStore: NexusGenRootTypes['DataStore'] | null; // DataStore
    devices: NexusGenRootTypes['DevicesConnection']; // DevicesConnection!
    node: NexusGenRootTypes['Node'] | null; // Node
    zones: NexusGenRootTypes['ZonesConnection']; // ZonesConnection!
  };
  UninstallDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device']; // Device!
  };
  UpdateDevicePayload: {
    // field return type
    device: NexusGenRootTypes['Device'] | null; // Device
  };
  Zone: {
    // field return type
    id: string; // ID!
    name: string; // String!
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
  };
  Node: {
    // field return type
    id: string; // ID!
  };
}

export interface NexusGenFieldTypeNames {
  AddDevicePayload: {
    // field return type name
    device: 'Device';
  };
  AddZonePayload: {
    // field return type name
    zone: 'Zone';
  };
  DataStore: {
    // field return type name
    config: 'String';
    operational: 'String';
  };
  DeleteDevicePayload: {
    // field return type name
    device: 'Device';
  };
  Device: {
    // field return type name
    address: 'String';
    id: 'ID';
    model: 'String';
    name: 'String';
    status: 'DeviceStatus';
    vendor: 'String';
    zone: 'Zone';
  };
  DeviceEdge: {
    // field return type name
    cursor: 'String';
    node: 'Device';
  };
  DevicesConnection: {
    // field return type name
    edges: 'DeviceEdge';
    pageInfo: 'PageInfo';
  };
  InstallDevicePayload: {
    // field return type name
    device: 'Device';
  };
  Mutation: {
    // field return type name
    addDevice: 'AddDevicePayload';
    addZone: 'AddZonePayload';
    deleteDevice: 'DeleteDevicePayload';
    installDevice: 'InstallDevicePayload';
    uninstallDevice: 'UninstallDevicePayload';
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
    dataStore: 'DataStore';
    devices: 'DevicesConnection';
    node: 'Node';
    zones: 'ZonesConnection';
  };
  UninstallDevicePayload: {
    // field return type name
    device: 'Device';
  };
  UpdateDevicePayload: {
    // field return type name
    device: 'Device';
  };
  Zone: {
    // field return type name
    id: 'ID';
    name: 'String';
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
  };
  Node: {
    // field return type name
    id: 'ID';
  };
}

export interface NexusGenArgTypes {
  Mutation: {
    addDevice: {
      // args
      input: NexusGenInputs['AddDeviceInput']; // AddDeviceInput!
    };
    addZone: {
      // args
      input: NexusGenInputs['AddZoneInput']; // AddZoneInput!
    };
    deleteDevice: {
      // args
      id: string; // String!
    };
    installDevice: {
      // args
      id: string; // String!
    };
    uninstallDevice: {
      // args
      id: string; // String!
    };
    updateDevice: {
      // args
      id: string; // String!
      input: NexusGenInputs['UpdateDeviceInput']; // UpdateDeviceInput!
    };
  };
  Query: {
    dataStore: {
      // args
      deviceId: string; // String!
    };
    devices: {
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
  Node: 'Device' | 'Zone';
}

export interface NexusGenTypeInterfaces {
  Device: 'Node';
  Zone: 'Node';
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = keyof NexusGenInputs;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = keyof NexusGenInterfaces;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = 'Node';

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false;
    resolveType: true;
    __typename: false;
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
