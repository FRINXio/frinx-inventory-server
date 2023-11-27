export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
};

export type CommonNodesResponse = {
  __typename?: 'CommonNodesResponse';
  common_nodes: Array<Scalars['String']>;
};

export type Coordinates = {
  __typename?: 'Coordinates';
  x: Scalars['Float'];
  y: Scalars['Float'];
};

export type CoordinatesInput = {
  node_name: Scalars['String'];
  node_type: CoordinatesNodeType;
  x: Scalars['Float'];
  y: Scalars['Float'];
};

export type CoordinatesNodeType =
  | 'device'
  | 'network';

export type CoordinatesResponse = {
  __typename?: 'CoordinatesResponse';
  not_updated: Array<Scalars['String']>;
  updated: Array<Scalars['String']>;
};

export type CreateBackupResponse = {
  __typename?: 'CreateBackupResponse';
  db_name: Scalars['String'];
};

export type DeleteBackupsResponse = {
  __typename?: 'DeleteBackupsResponse';
  deleted_backups: Array<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createBackup: CreateBackupResponse;
  deleteBackups: DeleteBackupsResponse;
  updateCoordinates: CoordinatesResponse;
};


export type MutationDeleteBackupsArgs = {
  delete_age?: InputMaybe<Scalars['Int']>;
};


export type MutationUpdateCoordinatesArgs = {
  coordinates_list: Array<CoordinatesInput>;
};

export type NetDevice = Node & {
  __typename?: 'NetDevice';
  id: Scalars['ID'];
  netInterfaces: NetInterfaceConnection;
  netNetworks: NetNetworkConnection;
  ospfAreaId: Scalars['String'];
  phyDevice: Maybe<PhyDevice>;
  routerId: Scalars['String'];
};


export type NetDeviceNetInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<NetInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type NetDeviceNetNetworksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<NetNetworkFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

export type NetDeviceConnection = {
  __typename?: 'NetDeviceConnection';
  edges: Maybe<Array<Maybe<NetDeviceEdge>>>;
  pageInfo: PageInfo;
};

export type NetDeviceEdge = {
  __typename?: 'NetDeviceEdge';
  cursor: Scalars['String'];
  node: Maybe<NetDevice>;
};

export type NetDeviceFilter = {
  ospfAreaId?: InputMaybe<Scalars['String']>;
  routerId?: InputMaybe<Scalars['String']>;
};

export type NetInterface = Node & {
  __typename?: 'NetInterface';
  id: Scalars['ID'];
  igp_metric: Maybe<Scalars['Int']>;
  ipAddress: Scalars['String'];
  netDevice: Maybe<NetDevice>;
  netLink: Maybe<NetInterface>;
};

export type NetInterfaceConnection = {
  __typename?: 'NetInterfaceConnection';
  edges: Maybe<Array<Maybe<NetInterfaceEdge>>>;
  pageInfo: PageInfo;
};

export type NetInterfaceEdge = {
  __typename?: 'NetInterfaceEdge';
  cursor: Scalars['String'];
  node: Maybe<NetInterface>;
};

export type NetInterfaceFilter = {
  ipAddress?: InputMaybe<Scalars['String']>;
};

export type NetNetwork = Node & {
  __typename?: 'NetNetwork';
  coordinates: Coordinates;
  id: Scalars['ID'];
  ospfRouteType: Scalars['Int'];
  subnet: Scalars['String'];
};

export type NetNetworkConnection = {
  __typename?: 'NetNetworkConnection';
  edges: Maybe<Array<Maybe<NetNetworkEdge>>>;
  pageInfo: Maybe<PageInfo>;
};

export type NetNetworkEdge = {
  __typename?: 'NetNetworkEdge';
  cursor: Scalars['String'];
  node: Maybe<NetNetwork>;
};

export type NetNetworkFilter = {
  ospfRouteType?: InputMaybe<Scalars['Int']>;
  subnet?: InputMaybe<Scalars['String']>;
};

export type NetRoutingPathConnection = {
  __typename?: 'NetRoutingPathConnection';
  edges: Maybe<Array<RoutingPath>>;
};

export type NetRoutingPathOutputCollections =
  | 'NetDevice'
  | 'NetInterface';

export type Node = {
  id: Scalars['ID'];
};

export type NodeInfo = {
  __typename?: 'NodeInfo';
  node: Scalars['ID'];
  weight: Maybe<Scalars['Int']>;
};

export type NodeStatus =
  | 'ok'
  | 'unknown';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
};

export type PhyDevice = Node & {
  __typename?: 'PhyDevice';
  coordinates: Coordinates;
  details: PhyDeviceDetails;
  id: Scalars['ID'];
  labels: Maybe<Array<Scalars['String']>>;
  name: Scalars['String'];
  netDevice: Maybe<NetDevice>;
  phyInterfaces: PhyInterfaceConnection;
  routerId: Maybe<Scalars['String']>;
  status: NodeStatus;
};


export type PhyDevicePhyInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PhyInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

export type PhyDeviceConnection = {
  __typename?: 'PhyDeviceConnection';
  edges: Maybe<Array<Maybe<PhyDeviceEdge>>>;
  pageInfo: PageInfo;
};

export type PhyDeviceDetails = {
  __typename?: 'PhyDeviceDetails';
  device_type: Scalars['String'];
  sw_version: Scalars['String'];
};

export type PhyDeviceEdge = {
  __typename?: 'PhyDeviceEdge';
  cursor: Scalars['String'];
  node: Maybe<PhyDevice>;
};

export type PhyDeviceFilter = {
  label?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};

export type PhyHasAndInterfacesResponse = {
  __typename?: 'PhyHasAndInterfacesResponse';
  phy_has_and_interfaces_data: Scalars['JSON'];
};

export type PhyInterface = Node & {
  __typename?: 'PhyInterface';
  id: Scalars['ID'];
  idLink: Maybe<Scalars['ID']>;
  name: Scalars['String'];
  phyDevice: Maybe<PhyDevice>;
  phyLink: Maybe<PhyInterface>;
  status: Scalars['String'];
};

export type PhyInterfaceConnection = {
  __typename?: 'PhyInterfaceConnection';
  edges: Maybe<Array<Maybe<PhyInterfaceEdge>>>;
  pageInfo: PageInfo;
};

export type PhyInterfaceEdge = {
  __typename?: 'PhyInterfaceEdge';
  cursor: Scalars['String'];
  node: Maybe<PhyInterface>;
};

export type PhyInterfaceFilter = {
  name?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Scalars['String']>;
};

export type PhyLinksAndDevicesResponse = {
  __typename?: 'PhyLinksAndDevicesResponse';
  phy_links_and_devices_data: Scalars['JSON'];
};

export type Query = {
  __typename?: 'Query';
  backups: Array<Scalars['String']>;
  commonNodes: CommonNodesResponse;
  netDevices: NetDeviceConnection;
  netRoutingPaths: Maybe<NetRoutingPathConnection>;
  node: Maybe<Node>;
  phyDevices: PhyDeviceConnection;
  phyHasAndInterfaces: PhyHasAndInterfacesResponse;
  phyLinksAndDevices: PhyLinksAndDevicesResponse;
  topologyDiff: TopologyResponse;
};


export type QueryCommonNodesArgs = {
  db_name?: InputMaybe<Scalars['String']>;
  selected_nodes: Array<Scalars['String']>;
};


export type QueryNetDevicesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<NetDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryNetRoutingPathsArgs = {
  deviceFrom: Scalars['ID'];
  deviceTo: Scalars['ID'];
  outputCollection?: InputMaybe<NetRoutingPathOutputCollections>;
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};


export type QueryPhyDevicesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PhyDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryTopologyDiffArgs = {
  collection_type: TopologyDiffCollectionTypes;
  new_db?: InputMaybe<Scalars['String']>;
  old_db?: InputMaybe<Scalars['String']>;
};

export type RoutingPath = {
  __typename?: 'RoutingPath';
  nodes: Array<NodeInfo>;
  weight: Scalars['Int'];
};

export type TopologyDiffCollectionTypes =
  | 'net'
  | 'phy';

export type TopologyResponse = {
  __typename?: 'TopologyResponse';
  diff_data: Maybe<Scalars['JSON']>;
};

export type GetShortestPathQueryVariables = Exact<{
  deviceFrom: Scalars['ID'];
  deviceTo: Scalars['ID'];
  collection?: InputMaybe<NetRoutingPathOutputCollections>;
}>;


export type GetShortestPathQuery = { __typename?: 'Query', netRoutingPaths: { __typename?: 'NetRoutingPathConnection', edges: Array<{ __typename?: 'RoutingPath', weight: number, nodes: Array<{ __typename?: 'NodeInfo', node: string, weight: number | null }> }> | null } | null };

export type TopologyDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type TopologyDevicesQuery = { __typename?: 'Query', phyDevices: { __typename?: 'PhyDeviceConnection', edges: Array<{ __typename?: 'PhyDeviceEdge', node: { __typename?: 'PhyDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, routerId: string | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'PhyDeviceDetails', sw_version: string, device_type: string }, phyInterfaces: { __typename?: 'PhyInterfaceConnection', edges: Array<{ __typename?: 'PhyInterfaceEdge', node: { __typename?: 'PhyInterface', id: string, name: string, status: string, phyLink: { __typename?: 'PhyInterface', id: string, idLink: string | null, name: string, phyDevice: { __typename?: 'PhyDevice', id: string, name: string } | null } | null } | null } | null> | null } } | null } | null> | null } };

export type NetTopologyQueryVariables = Exact<{ [key: string]: never; }>;


export type NetTopologyQuery = { __typename?: 'Query', netDevices: { __typename?: 'NetDeviceConnection', edges: Array<{ __typename?: 'NetDeviceEdge', node: { __typename?: 'NetDevice', id: string, routerId: string, phyDevice: { __typename?: 'PhyDevice', id: string, routerId: string | null, coordinates: { __typename?: 'Coordinates', x: number, y: number } } | null, netInterfaces: { __typename?: 'NetInterfaceConnection', edges: Array<{ __typename?: 'NetInterfaceEdge', cursor: string, node: { __typename?: 'NetInterface', id: string, ipAddress: string, netDevice: { __typename?: 'NetDevice', id: string, routerId: string } | null, netLink: { __typename?: 'NetInterface', id: string, igp_metric: number | null, netDevice: { __typename?: 'NetDevice', id: string, routerId: string } | null } | null } | null } | null> | null }, netNetworks: { __typename?: 'NetNetworkConnection', edges: Array<{ __typename?: 'NetNetworkEdge', node: { __typename?: 'NetNetwork', id: string, subnet: string, coordinates: { __typename?: 'Coordinates', x: number, y: number } } | null } | null> | null } } | null } | null> | null } };

export type GetBackupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackupsQuery = { __typename?: 'Query', backups: Array<string> };

export type TopologyDiffQueryVariables = Exact<{
  new_db: Scalars['String'];
  old_db: Scalars['String'];
}>;


export type TopologyDiffQuery = { __typename?: 'Query', topologyDiff: { __typename?: 'TopologyResponse', diff_data: any | null } };

export type GetLinksAndDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLinksAndDevicesQuery = { __typename?: 'Query', phyLinksAndDevices: { __typename?: 'PhyLinksAndDevicesResponse', phy_links_and_devices_data: any } };

export type GetHasAndInterfacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHasAndInterfacesQuery = { __typename?: 'Query', phyHasAndInterfaces: { __typename?: 'PhyHasAndInterfacesResponse', phy_has_and_interfaces_data: any } };

export type GetCommonNodesQueryVariables = Exact<{
  selectedNodes: Array<Scalars['String']> | Scalars['String'];
}>;


export type GetCommonNodesQuery = { __typename?: 'Query', commonNodes: { __typename?: 'CommonNodesResponse', common_nodes: Array<string> } };

export type UpdateCoordinatesMutationVariables = Exact<{
  coordinates: Array<CoordinatesInput> | CoordinatesInput;
}>;


export type UpdateCoordinatesMutation = { __typename?: 'Mutation', updateCoordinates: { __typename?: 'CoordinatesResponse', updated: Array<string> } };
