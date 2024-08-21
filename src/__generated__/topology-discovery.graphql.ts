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

/** Response from the commonNodes query that wraps the list of found common nodes in the database. */
export type CommonNodesResponse = {
  __typename?: 'CommonNodesResponse';
  /** List of the common node names. Common nodes contain connection to all nodes specified on the input. */
  common_nodes: Array<Scalars['String']>;
};

/** Coordinates of the node on the graph. */
export type Coordinates = {
  __typename?: 'Coordinates';
  /** Horizontal coordinate of the node on the graph. */
  x: Scalars['Float'];
  /** Vertical coordinate of the node on the graph. */
  y: Scalars['Float'];
};

/** Input of the updateCoordinates mutation that contains information about updated coordinates of a node. */
export type CoordinatesInput = {
  /** Name of the node in the topology. */
  node_name: Scalars['String'];
  /** Type of the node in the topology. */
  node_type: CoordinatesNodeType;
  /** Updated horizontal coordinate of the node on the graph. */
  x: Scalars['Float'];
  /** Updated vertical coordinate of the node on the graph. */
  y: Scalars['Float'];
};

/** Type of the node in the topology for which the coordinates are being updated. */
export type CoordinatesNodeType =
  /** Node that represent device in a topology (for example, PhyDevice or NetDevice collections). */
  | 'device'
  /** Node that represents IP network in the network topology (NetNetwork collection). */
  | 'network';

/** Response from the updateCoordinates query that contains information about updated coordinated of selected nodes. */
export type CoordinatesResponse = {
  __typename?: 'CoordinatesResponse';
  /** Devices that exist in the database. */
  installed: InstalledDevices;
  /** List of node names that do not exist in the database. */
  not_installed: Array<Scalars['String']>;
};

/** Response from the createBackup mutation that contains information about created backup. */
export type CreateBackupResponse = {
  __typename?: 'CreateBackupResponse';
  /** Name of the created backup database. Format: f"backup_{datetime.today().strftime('%Y%m%d%H%M%S')}". */
  db_name: Scalars['String'];
};

/** Response from the deleteBackups mutation that contains information about removed backups. */
export type DeleteBackupsResponse = {
  __typename?: 'DeleteBackupsResponse';
  /** Names of the removed databases that contained backups. */
  deleted_backups: Array<Scalars['String']>;
};

/** Device GeoLocation data. */
export type DeviceGeoLocation = {
  __typename?: 'DeviceGeoLocation';
  /** Defining the area around the device, with four elements indicating its boundaries. */
  bbox: Maybe<Array<Maybe<Scalars['Float']>>>;
  /** Device location coordinates providing longitude and latitude (in this order, based on GeoJSON convention). */
  coordinates: Array<Scalars['Float']>;
  /** Type of geometry. */
  type: GeometryType;
};

/** Representation of the device in the metadata. */
export type DeviceMetadata = Node & {
  __typename?: 'DeviceMetadata';
  /** Human readable name of the device. */
  deviceName: Scalars['String'];
  /** Type of the device (ex. router). */
  deviceType: Maybe<Scalars['String']>;
  /** Device geographic data of point type in GeoJson format. */
  geoLocation: Maybe<DeviceGeoLocation>;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Model of the device (XR, ASR). */
  model: Maybe<Scalars['String']>;
  /** Protocol used for management for the device (cli, netconf, gnmi). */
  protocolType: Maybe<Scalars['String']>;
  /** Vendor of the device (ex. Cisco). */
  vendor: Maybe<Scalars['String']>;
  /** Version of the device software (ex. 6.0.1). */
  version: Maybe<Scalars['String']>;
};

/** Grouped Metadata device object and associated cursor used by pagination. */
export type DeviceMetadataEdge = {
  __typename?: 'DeviceMetadataEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated MetadataDevice object. */
  node: Maybe<DeviceMetadata>;
};

/** Filter for Metadata device type based on device name, or other attributes. */
export type DeviceMetadataFilter = {
  /** Regex of device name. */
  deviceName?: InputMaybe<Scalars['String']>;
  /**
   * A GeoJSON Polygon shape used for filtering devices based on their location in this area.
   *
   * The GeoJSON Polygon consists of a series of closed LineString objects (ring-like).
   * These Linear Ring objects consist of four or more coordinate pairs with the first and last coordinate
   * pair being equal. Coordinate pairs of a Polygon are an array of linear ring coordinate arrays.
   * The first element in the array represents the exterior ring.
   * Any subsequent elements represent interior rings (holes within the surface).
   *
   * The orientation of the first linear ring is crucial: the right-hand-rule is applied, so that the area to the left
   * of the path of the linear ring (when walking on the surface of the Earth) is considered to be the “interior”
   * of the polygon. All other linear rings must be contained within this interior.
   *
   * Example with a hole:
   * [
   *     [
   *         [100.0, 0.0],
   *         [101.0, 0.0],
   *         [101.0, 1.0],
   *         [100.0, 1.0],
   *         [100.0, 0.0]
   *     ],
   *     [
   *         [100.8, 0.8],
   *         [100.8, 0.2],
   *         [100.2, 0.2],
   *         [100.2, 0.8],
   *         [100.8, 0.8]
   *     ]
   * ]
   */
  polygon?: InputMaybe<Array<Array<Array<Scalars['Float']>>>>;
  /** Topology in which device must be present. */
  topologyType?: InputMaybe<TopologyType>;
};

/** Type of geometry. */
export type GeometryType =
  | 'Point';

export type InstalledDevices = {
  __typename?: 'InstalledDevices';
  /** List of node names which coordinates have not been updated. */
  not_updated: Array<Scalars['String']>;
  /** List of node names which coordinates have been updated. */
  updated: Array<Scalars['String']>;
};

/** LSP Tunnel (related to tunnel originating from this device). */
export type LspTunnel = {
  __typename?: 'LspTunnel';
  /** From which device is the tunnel originating. */
  from_device: Maybe<Scalars['String']>;
  /** Name of the link state packet. */
  lsp_id: Scalars['String'];
  /** Type of signalisation. */
  signalisation: Signalisation;
  /** Where is the tunnel headed. */
  to_device: Maybe<Scalars['String']>;
  /** Uptime of the tunnel in seconds. */
  uptime: Maybe<Scalars['Int']>;
};

/** Grouped list of Metadata device objects and pagination metadata. */
export type MetadataConnection = {
  __typename?: 'MetadataConnection';
  /** List of Metadata device objects. */
  edges: Maybe<Array<Maybe<DeviceMetadataEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** MPLS Data (related to all tunnels). */
export type MplsData = {
  __typename?: 'MplsData';
  /** The input interface. */
  in_interface: Maybe<Scalars['String']>;
  /** The input label. */
  in_label: Maybe<Scalars['Int']>;
  /** Where the tunnel is headed (Router IP.) */
  ldp_prefix: Maybe<Scalars['String']>;
  /** Name of the link state packet. */
  lsp_id: Scalars['String'];
  /** The operation type. */
  mpls_operation: Maybe<MplsOperation>;
  /** Operational state of the device. */
  oper_state: Maybe<Scalars['String']>;
  /** The input interface. */
  out_interface: Maybe<Scalars['String']>;
  /** The output label. */
  out_label: Maybe<Scalars['Int']>;
  /** Type of signalisation. */
  signalisation: Maybe<Signalisation>;
};

/** Representation of the device in the MPLS topology. */
export type MplsDevice = Node & {
  __typename?: 'MplsDevice';
  /** Coordinates of the device node on the graph. */
  coordinates: Coordinates;
  /** Details of the device. */
  details: MplsDeviceDetails;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** List of strings that can be used for grouping of synced devices. */
  labels: Maybe<Array<Scalars['String']>>;
  /** List of ports that are present on the device. */
  mplsInterfaces: MplsInterfaceConnection;
  /** Human readable name of the device. */
  name: Scalars['String'];
  /** Status of the device from the view of the synced topology. */
  status: NodeStatus;
};


/** Representation of the device in the MPLS topology. */
export type MplsDeviceMplsInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<MplsInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of MplsDevice objects and pagination metadata. */
export type MplsDeviceConnection = {
  __typename?: 'MplsDeviceConnection';
  /** List of MplsDevice objects. */
  edges: Maybe<Array<Maybe<MplsDeviceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details specific to MPLS (Multi-Protocol Label Switching). */
export type MplsDeviceDetails = {
  __typename?: 'MplsDeviceDetails';
  lsp_tunnels: Maybe<Array<Maybe<LspTunnel>>>;
  mpls_data: Maybe<Array<Maybe<MplsData>>>;
  router_id: Maybe<Scalars['String']>;
};

/** Grouped MplsDevice object and associated cursor used by pagination. */
export type MplsDeviceEdge = {
  __typename?: 'MplsDeviceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated MplsDevice object. */
  node: Maybe<MplsDevice>;
};

/** Filter for MplsDevice type based on device label and device name. */
export type MplsDeviceFilter = {
  /** Device label. */
  label?: InputMaybe<Scalars['String']>;
  /** Regex of device name. */
  name?: InputMaybe<Scalars['String']>;
};

/** Port attached to the MPLS device. */
export type MplsInterface = Node & {
  __typename?: 'MplsInterface';
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Device that owns this interface. */
  mplsDevice: Maybe<MplsDevice>;
  /** Link to connected remote MPLS device. */
  mplsLinks: Maybe<MplsLinkConnection>;
  /** Human readable name of the network port. */
  name: Scalars['String'];
  /** Status of the interface from the view of the synced topology ('ok' or 'unknown'). */
  status: NodeStatus;
};


/** Port attached to the MPLS device. */
export type MplsInterfaceMplsLinksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of MplsInterface objects and pagination metadata. */
export type MplsInterfaceConnection = {
  __typename?: 'MplsInterfaceConnection';
  /** List of MplsInterface objects. */
  edges: Maybe<Array<Maybe<MplsInterfaceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped MplsInterface object and associated cursor used by pagination. */
export type MplsInterfaceEdge = {
  __typename?: 'MplsInterfaceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated MplsInterface object. */
  node: Maybe<MplsInterface>;
};

/** Filter for MplsInterface type based on the current interface status and name of the device. */
export type MplsInterfaceFilter = {
  /** Regex of interface name. */
  name?: InputMaybe<Scalars['String']>;
  /** Status of the interface from the view of the synced topology. */
  status?: InputMaybe<NodeStatus>;
};

/** Grouped list of MplsLinks objects and pagination metadata. */
export type MplsLinkConnection = {
  __typename?: 'MplsLinkConnection';
  /** List of MplsInterface objects. */
  edges: Maybe<Array<Maybe<MplsLinkEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped MplsLink object and associated cursor used by pagination. */
export type MplsLinkEdge = {
  __typename?: 'MplsLinkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** Identifier of the link that connects this interface to the interface on the remote device */
  link: Maybe<Scalars['ID']>;
  /** The associated MplsInterface object. */
  node: Maybe<MplsInterface>;
};

export type MplsOperation =
  | 'Noop'
  | 'Pop'
  | 'Push'
  | 'Swap';

export type MplsTotalLsps = {
  __typename?: 'MplsTotalLsps';
  /** Number of incoming LSPs. */
  incoming_lsps: Maybe<Scalars['Int']>;
  /** Number of outcoming LSPs. */
  outcoming_lsps: Maybe<Scalars['Int']>;
  /** To which device the LSP is headed. */
  to_device: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Creation of the backup from the whole database including all graphs.
   * Name of the backup database is derived from the current timestamp and returned in the response.
   */
  createBackup: CreateBackupResponse;
  /**
   * Removing backups that are older than the specified number of hours.
   * Response contains the list of removed backup databases.
   */
  deleteBackups: DeleteBackupsResponse;
  /**
   * Enable debug session to the remote Python debug server.
   * If debug session has already been enabled, it will be reloaded with new settings.
   * Debug session is automatically closed after client stops debugging.
   * Response contains version of the debug library.
   */
  enableRemoteDebugSession: Scalars['String'];
  /**
   * Synchronization of the devices in the specified topology.
   * Topology represents an abstraction layer of observed network from the operational view
   * (for example, physical topology that is built from LLDP data, or network topology that is built from BGP-LS data).
   * During synchronization topology-discovery service reads topological information from network devices,
   * parses read data using drivers into graph data model, and builds the graph that is stored in the graph database.
   * Response contains information about synced devices and their neighbors.
   */
  sync: SyncResponse;
  /**
   * Updating the coordinates of the specified nodes on the graph (x,y fractional values).
   * Response contains list of successfully and unsuccessfully updated nodes.
   */
  updateCoordinates: CoordinatesResponse;
  /**
   * Updating status of the specified device or attached interfaces and edges between device and interfaces.
   * A: If there is status and device_name param, status is changed for PhyDevice / PtpDevice document.
   * B: If there is also interface_name, status is changed only for PhyInterface / PtpInterface and PhyHas / PtpHas documents.
   * JSON response:
   * A: {"device": device_document},
   * B: {"has": has_document, "interface": interface_document}
   */
  updateNodeStatus: Scalars['JSON'];
};


export type MutationDeleteBackupsArgs = {
  delete_age?: InputMaybe<Scalars['Int']>;
};


export type MutationEnableRemoteDebugSessionArgs = {
  host: Scalars['String'];
  port?: InputMaybe<Scalars['Int']>;
  stderr_to_server?: InputMaybe<Scalars['Boolean']>;
  stdout_to_server?: InputMaybe<Scalars['Boolean']>;
};


export type MutationSyncArgs = {
  devices?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  labels?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  provider_name: Scalars['String'];
};


export type MutationUpdateCoordinatesArgs = {
  coordinates_list: Array<CoordinatesInput>;
  topology_type?: InputMaybe<TopologyType>;
};


export type MutationUpdateNodeStatusArgs = {
  device_name: Scalars['String'];
  interface_name?: InputMaybe<Scalars['String']>;
  status: NodeStatus;
  topology_type?: InputMaybe<TopologyType>;
};

/** Representation of the routing entity in the network topology. */
export type NetDevice = Node & {
  __typename?: 'NetDevice';
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Interfaces that are used for connecting to other routing entities. */
  netInterfaces: NetInterfaceConnection;
  /** Networks that are attached to the routing entity. */
  netNetworks: NetNetworkConnection;
  /** Identifier of OSPF area formatted as IPv4 address (for example, 0.0.0.0 represents area 0). */
  ospfAreaId: Scalars['String'];
  /** Linked device in the physical topology. */
  phyDevice: Maybe<PhyDevice>;
  /** Identifier of the routing entity (usually IPv4 address). RouterId and ospfAreaId together compose a unique key. */
  routerId: Scalars['String'];
};


/** Representation of the routing entity in the network topology. */
export type NetDeviceNetInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<NetInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


/** Representation of the routing entity in the network topology. */
export type NetDeviceNetNetworksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<NetNetworkFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of NetDevice objects and pagination metadata. */
export type NetDeviceConnection = {
  __typename?: 'NetDeviceConnection';
  /** List of NetDevice objects. */
  edges: Maybe<Array<Maybe<NetDeviceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped NetDevice object and associated cursor used by pagination. */
export type NetDeviceEdge = {
  __typename?: 'NetDeviceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated NetDevice object. */
  node: Maybe<NetDevice>;
};

/** Filter for NetDevice type based on router identifier and area identifier. */
export type NetDeviceFilter = {
  /** OSPF area identifier formatted as IPv4 address (for example, 0.0.0.0 represents area 0). */
  ospfAreaId?: InputMaybe<Scalars['String']>;
  /** Regex of router identifier of the routing entity (usually IPv4 address). */
  routerId?: InputMaybe<Scalars['String']>;
};

/** Network interface attached to the network device. */
export type NetInterface = Node & {
  __typename?: 'NetInterface';
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** IGP metric configured on the network interface. */
  igp_metric: Maybe<Scalars['Int']>;
  /** IP address configured on the interface. */
  ipAddress: Scalars['String'];
  /** Routing entity that owns this interface. */
  netDevice: Maybe<NetDevice>;
  /** Links to connected remote network devices. */
  netLinks: NetLinkConnection;
};


/** Network interface attached to the network device. */
export type NetInterfaceNetLinksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of NetInterface objects and pagination metadata. */
export type NetInterfaceConnection = {
  __typename?: 'NetInterfaceConnection';
  /** List of NetInterface objects. */
  edges: Maybe<Array<Maybe<NetInterfaceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped NetInterface object and associated cursor used by pagination. */
export type NetInterfaceEdge = {
  __typename?: 'NetInterfaceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated NetInterface object. */
  node: Maybe<NetInterface>;
};

/** Filter for NetInterface type based on the configured IP address. */
export type NetInterfaceFilter = {
  /** Regex of IP address configured on the interface. */
  ipAddress?: InputMaybe<Scalars['String']>;
};

/** Grouped list of NetLinks objects and pagination metadata. */
export type NetLinkConnection = {
  __typename?: 'NetLinkConnection';
  /** List of NetInterface objects. */
  edges: Maybe<Array<Maybe<NetLinkEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

export type NetLinkEdge = {
  __typename?: 'NetLinkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** Identifier of the link that connects this interface to the interface on the remote device */
  link: Maybe<Scalars['ID']>;
  /** The associated NetInterface object. */
  node: Maybe<NetInterface>;
};

/** IP subnet in the network topology. */
export type NetNetwork = Node & {
  __typename?: 'NetNetwork';
  /** Coordinates of the network node on the graph. */
  coordinates: Coordinates;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Type of the OSPF network (LSA type). */
  ospfRouteType: Scalars['Int'];
  /** Network address including prefix length expressed in the CIDR notation (e.g. 10.0.0.0/24). */
  subnet: Scalars['String'];
};

/** Grouped list of NetNetwork objects and pagination metadata. */
export type NetNetworkConnection = {
  __typename?: 'NetNetworkConnection';
  /** List of NetNetwork objects. */
  edges: Maybe<Array<Maybe<NetNetworkEdge>>>;
  /** Pagination metadata. */
  pageInfo: Maybe<PageInfo>;
};

export type NetNetworkEdge = {
  __typename?: 'NetNetworkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated NetNetwork object. */
  node: Maybe<NetNetwork>;
};

/** Filter for NetNetwork type based on the subnet and route type. */
export type NetNetworkFilter = {
  /** Type of the OSPF network (LSA type). */
  ospfRouteType?: InputMaybe<Scalars['Int']>;
  /** Regex of network address including prefix length (e.g. 10.0.0.0/24) */
  subnet?: InputMaybe<Scalars['String']>;
};

/** Computed routing paths from source to destination device. */
export type NetRoutingPathConnection = {
  __typename?: 'NetRoutingPathConnection';
  /** List of routing paths from source to destination device. Ordered from shortest to longest path based on weight. */
  edges: Maybe<Array<RoutingPath>>;
};

/** Types of the nodes that should be included in the returned path. */
export type NetRoutingPathOutputCollections =
  /** Include NetDevice nodes in the returned path. */
  | 'NetDevice'
  /** Include NetInterface nodes in the returned path. */
  | 'NetInterface';

/** Generic node that can be identified using Globally Unique ID. */
export type Node = {
  /** Unique identifier of the object. */
  id: Scalars['ID'];
};

/** Information about a node that is part of the computed path. */
export type NodeInfo = {
  __typename?: 'NodeInfo';
  /** Unique identifier of the node on the path. */
  node: Scalars['ID'];
  /** Weight of the node on the path. Weight is present only on the nodes of NetDevice type. */
  weight: Maybe<Scalars['Int']>;
};

/** Status of the node from the view of the device registry. */
export type NodeStatus =
  /** Node is known - it has been installed in the device registry. */
  | 'ok'
  /** Node is unknown - sync process has detected presence of this node but it is not present in the device registry. */
  | 'unknown';

/** Pagination metadata that is usually coupled to a returned list of objects. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Pointer to the last object in the list. */
  endCursor: Maybe<Scalars['String']>;
  /** Indicates if there is a next object in the list. */
  hasNextPage: Scalars['Boolean'];
};

/** Representation of the device in the physical topology. */
export type PhyDevice = Node & {
  __typename?: 'PhyDevice';
  /** Coordinates of the device node on the graph. */
  coordinates: Coordinates;
  /** Details of the device. */
  details: PhyDeviceDetails;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** List of strings that can be used for grouping of synced devices. */
  labels: Maybe<Array<Scalars['String']>>;
  /** Human readable name of the device. */
  name: Scalars['String'];
  /** Linked device in the network topology. */
  netDevice: Maybe<NetDevice>;
  /** List of ports that are present on the device. */
  phyInterfaces: PhyInterfaceConnection;
  /** Identifier of the corresponding routing entity in the network topology. */
  routerId: Maybe<Scalars['String']>;
  /** Status of the device from the view of the synced topology. */
  status: NodeStatus;
};


/** Representation of the device in the physical topology. */
export type PhyDevicePhyInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PhyInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of PhyDevice objects and pagination metadata. */
export type PhyDeviceConnection = {
  __typename?: 'PhyDeviceConnection';
  /** List of PhyDevice objects. */
  edges: Maybe<Array<Maybe<PhyDeviceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details of the device. */
export type PhyDeviceDetails = {
  __typename?: 'PhyDeviceDetails';
  /** Device type (e.g. device model, vendor, chassis, hardware details, etc.) */
  device_type: Maybe<Scalars['String']>;
  /** Version of the network operating system running on the device. */
  sw_version: Maybe<Scalars['String']>;
};

/** Grouped PhyDevice object and associated cursor used by pagination. */
export type PhyDeviceEdge = {
  __typename?: 'PhyDeviceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated PhyDevice object. */
  node: Maybe<PhyDevice>;
};

/** Filter for PhyDevice type based on device label and device name. */
export type PhyDeviceFilter = {
  /** Device label. */
  label?: InputMaybe<Scalars['String']>;
  /** Regex of device name. */
  name?: InputMaybe<Scalars['String']>;
};

/** Port attached to the physical device. */
export type PhyInterface = Node & {
  __typename?: 'PhyInterface';
  /** Details of the interface. */
  details: Maybe<PhyInterfaceDetails>;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Human readable name of the network port. */
  name: Scalars['String'];
  /** Device that owns this interface. */
  phyDevice: Maybe<PhyDevice>;
  /** List of links connected to remote physical device. */
  phyLinks: PhyLinkConnection;
  /** Status of the interface from the view of the synced topology ('ok' or 'unknown'). */
  status: NodeStatus;
};


/** Port attached to the physical device. */
export type PhyInterfacePhyLinksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of PhyInterface objects and pagination metadata. */
export type PhyInterfaceConnection = {
  __typename?: 'PhyInterfaceConnection';
  /** List of PhyInterface objects. */
  edges: Maybe<Array<Maybe<PhyInterfaceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details of the interface. */
export type PhyInterfaceDetails = {
  __typename?: 'PhyInterfaceDetails';
  /** Max operational interface bandwidth in Mbit. */
  max_speed: Maybe<Scalars['Float']>;
};

/** Grouped PhyInterface object and associated cursor used by pagination. */
export type PhyInterfaceEdge = {
  __typename?: 'PhyInterfaceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated PhyInterface object. */
  node: Maybe<PhyInterface>;
};

/** Filter for PhyInterface type based on the current interface status and name of the device. */
export type PhyInterfaceFilter = {
  /** Regex of interface name. */
  name?: InputMaybe<Scalars['String']>;
  /** Status of the interface from the view of the synced topology. */
  status?: InputMaybe<Scalars['String']>;
};

/** Grouped list of PhyLinks objects and pagination metadata. */
export type PhyLinkConnection = {
  __typename?: 'PhyLinkConnection';
  /** List of PhyInterface objects. */
  edges: Maybe<Array<Maybe<PhyLinkEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

export type PhyLinkEdge = {
  __typename?: 'PhyLinkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** Identifier of the link that connects this interface to the interface on the remote device */
  link: Maybe<Scalars['ID']>;
  /** The associated PhyInterface object. */
  node: Maybe<PhyInterface>;
};

/** Response from the provider query that contains information about supported device types in the specified topology. */
export type ProviderResponse = {
  __typename?: 'ProviderResponse';
  /** List of the supported device types in the specified topology (e.g. ios, ios xe, sros, etc.) */
  supported_devices: Array<Scalars['String']>;
};

/** Representation of the device in the ptp topology. */
export type PtpDevice = Node & {
  __typename?: 'PtpDevice';
  /** Coordinates of the device node on the graph. */
  coordinates: Coordinates;
  /** Details of the device. */
  details: PtpDeviceDetails;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** List of strings that can be used for grouping of synced devices. */
  labels: Maybe<Array<Scalars['String']>>;
  /** Human readable name of the device. */
  name: Scalars['String'];
  /** List of ports that are present on the device. */
  ptpInterfaces: PtpInterfaceConnection;
  /** Status of the device from the view of the synced topology. */
  status: NodeStatus;
};


/** Representation of the device in the ptp topology. */
export type PtpDevicePtpInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PtpInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of PtpDevice objects and pagination metadata. */
export type PtpDeviceConnection = {
  __typename?: 'PtpDeviceConnection';
  /** List of PtpDevice objects. */
  edges: Maybe<Array<Maybe<PtpDeviceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details specific to PTP (Precision Time Protocol). */
export type PtpDeviceDetails = {
  __typename?: 'PtpDeviceDetails';
  /**
   * How accurate is the clock output to primary reference. This parameter is often automatically determined
   * by the device based on the characteristics of its internal clock oscillator and how well it can track
   * the reference time.
   */
  clock_accuracy: Maybe<Scalars['String']>;
  /** Measure of clock traceability. */
  clock_class: Maybe<Scalars['Int']>;
  /** Unique identifier of the clock. */
  clock_id: Maybe<Scalars['String']>;
  /** Type of clock (e.g., ordinary, master). */
  clock_type: Maybe<Scalars['String']>;
  /**
   * Measure of clock precision. How much the clock-output varies when not synchronized to another source.
   * The variance is determined by assessing how much the local clock deviates from the ideal time over a certain period,
   * often expressed in parts per billion (ppb) or as the standard deviation of the clock's offset.
   */
  clock_variance: Maybe<Scalars['String']>;
  /** Domain of the PTP network. */
  domain: Maybe<Scalars['Int']>;
  /** Global priority of the clock (the first priority). */
  global_priority: Maybe<Scalars['Int']>;
  /** Unique identifier of the grandmaster clock. */
  gm_clock_id: Maybe<Scalars['String']>;
  /** Unique identifier of the parent clock. */
  parent_clock_id: Maybe<Scalars['String']>;
  /** The port state of the device. */
  ptp_port_state: Maybe<Scalars['String']>;
  /** PTP profile used (e.g., ITU-T G.8275.1). */
  ptp_profile: Maybe<Scalars['String']>;
  /**
   * Indicates the current state of the time recovery process. Time recovery is the process of adjusting
   * the local clock to synchronize with a more accurate reference clock.
   */
  time_recovery_status: Maybe<Scalars['String']>;
  /** User defined value of the second priority. */
  user_priority: Maybe<Scalars['Int']>;
};

/** Grouped PtpDevice object and associated cursor used by pagination. */
export type PtpDeviceEdge = {
  __typename?: 'PtpDeviceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated PtpDevice object. */
  node: Maybe<PtpDevice>;
};

/** Filter for PtpDevice type based on device label and device name. */
export type PtpDeviceFilter = {
  /** Regex: clock accuracy to primary reference. */
  clock_accuracy?: InputMaybe<Scalars['String']>;
  /** Measure of clock traceability. */
  clock_class?: InputMaybe<Scalars['Int']>;
  /** Regex: Unique identifier of the clock. */
  clock_id?: InputMaybe<Scalars['String']>;
  /** Regex: Type of clock (e.g., ordinary, master). */
  clock_type?: InputMaybe<Scalars['String']>;
  /** Regex: measure of clock precision. */
  clock_variance?: InputMaybe<Scalars['String']>;
  /** Domain of the PTP network. */
  domain?: InputMaybe<Scalars['Int']>;
  /** Device label. */
  label?: InputMaybe<Scalars['String']>;
  /** Regex of device name. */
  name?: InputMaybe<Scalars['String']>;
  /** PTP profile used (e.g., ITU-T G.8275.1). */
  ptp_profile?: InputMaybe<Scalars['String']>;
  /** Regex: indicates the current state of the time recovery process. */
  time_recovery_status?: InputMaybe<Scalars['String']>;
};

/** A Ptp node that uses a different upstream path in SyncE topology */
export type PtpDiffSynce = Node & {
  __typename?: 'PtpDiffSynce';
  /** Ptp node id */
  id: Scalars['ID'];
  /** Ptp node's upstream interface */
  ptpUpstreamInterface: Maybe<Scalars['ID']>;
  /** Ptp node's upstream interface name */
  ptpUpstreamInterfaceName: Maybe<Scalars['String']>;
  /** Ptp node's upstream interface status */
  ptpUpstreamInterfaceStatus: Maybe<Scalars['String']>;
  /** SyncE node id. This is the same device as identified */
  synceId: Maybe<Scalars['ID']>;
  /** Synce node's upstream interface name */
  synceUpstreamInterfaceName: Maybe<Scalars['String']>;
};

/** Grouped list of PtpDiffSynceDevice objects and pagination metadata. */
export type PtpDiffSynceConnection = {
  __typename?: 'PtpDiffSynceConnection';
  /** List of PtpDiffSynce objects. */
  edges: Maybe<Array<Maybe<PtpDiffSynceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped PtpDiffSynceDevice object and associated cursor used by pagination. */
export type PtpDiffSynceEdge = {
  __typename?: 'PtpDiffSynceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated PtpDiffSynce object. */
  node: Maybe<PtpDiffSynce>;
};

/** Port attached to the ptp device. */
export type PtpInterface = Node & {
  __typename?: 'PtpInterface';
  /** Interface details specific to PTP (Precision Time Protocol). */
  details: Maybe<PtpInterfaceDetails>;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Human readable name of the network port. */
  name: Scalars['String'];
  /** Device that owns this interface. */
  ptpDevice: Maybe<PtpDevice>;
  /** List of links connected to remote ptp devices. */
  ptpLinks: PtpLinkConnection;
  /** Status of the interface from the view of the synced topology ('ok' or 'unknown'). */
  status: NodeStatus;
};


/** Port attached to the ptp device. */
export type PtpInterfacePtpLinksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of PtpInterface objects and pagination metadata. */
export type PtpInterfaceConnection = {
  __typename?: 'PtpInterfaceConnection';
  /** List of PtpInterface objects. */
  edges: Maybe<Array<Maybe<PtpInterfaceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** PTP interface details. */
export type PtpInterfaceDetails = {
  __typename?: 'PtpInterfaceDetails';
  /** Administrative/operational status of the interface (e.g. 'up/up', 'up/down'). */
  admin_oper_status: Scalars['String'];
  /** State of the PTP process on the interface (e.g. 'master', 'slave', 'disabled', 'passive', 'unknown'). */
  ptp_status: Scalars['String'];
  /**
   * Unusable packet timing signal received by the slave, for example, where the packet delay variation is excessive,
   * resulting in the slave being unable to meet the output clock performance requirements.
   */
  ptsf_unusable: Scalars['String'];
};

/** Grouped PtpInterface object and associated cursor used by pagination. */
export type PtpInterfaceEdge = {
  __typename?: 'PtpInterfaceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated PtpInterface object. */
  node: Maybe<PtpInterface>;
};

/** Filter for PtpInterface type based on the current interface status and name of the device. */
export type PtpInterfaceFilter = {
  /** Regex of administrative/operational status on the interface (e.g. 'up/up', 'up/down'). */
  admin_oper_status?: InputMaybe<Scalars['String']>;
  /** Regex of interface name. */
  name?: InputMaybe<Scalars['String']>;
  /** Regex of the PTP process status on the interface. */
  ptp_status?: InputMaybe<Scalars['String']>;
  /** Regex of unusable packet timing signal received by the slave. */
  ptsf_unusable?: InputMaybe<Scalars['String']>;
  /** Status of the interface from the view of the synced topology. */
  status?: InputMaybe<NodeStatus>;
};

/** Grouped list of PtpLinks objects and pagination metadata. */
export type PtpLinkConnection = {
  __typename?: 'PtpLinkConnection';
  /** List of PtpInterface objects. */
  edges: Maybe<Array<Maybe<PtpLinkEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped PtpLink object and associated cursor used by pagination. */
export type PtpLinkEdge = {
  __typename?: 'PtpLinkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** Identifier of the link that connects this interface to the interface on the remote device */
  link: Maybe<Scalars['ID']>;
  /** The associated PtpInterface object. */
  node: Maybe<PtpInterface>;
};

/** Computed path from source to destination PTP clock device. */
export type PtpPath = {
  __typename?: 'PtpPath';
  /** True if path is complete - the last element in the path represents GM clock, False otherwise. */
  complete: Scalars['Boolean'];
  /** Ordered list of node identifiers that compose path from source clock to destination clock. */
  nodes: Maybe<Array<Scalars['ID']>>;
};

/** Types of the nodes that should be included in the returned path. */
export type PtpPathOutputCollections =
  /** Include PtpDevice nodes in the returned path. */
  | 'PtpDevice'
  /** Include PtpInterface nodes in the returned path. */
  | 'PtpInterface';

export type Query = {
  __typename?: 'Query';
  /**
   * Read list of created backups.
   * List of backup database names are converted to ISO datetime format: %Y-%m-%dT%H:%M:%S.%f. Example:
   * Name of the backup database: backup_20221014130000.
   * Formatted identifier: 2022-10-14T13:00:00.000000.
   */
  backups: Array<Scalars['String']>;
  /**
   * Find nodes that have connection to all selected nodes in the specified database.
   * In case of the PhyDevice devices, the common nodes represent devices that contain physical interface-based
   * link to all specified input devices.
   * In case of other types of nodes (for example, in the network topology), implementation logic may vary.
   */
  commonNodes: CommonNodesResponse;
  /** Read devices that match specified filter. */
  deviceMetadata: MetadataConnection;
  /** Read MPLS devices that match the specified filter. */
  mplsDevices: MplsDeviceConnection;
  /**
   * Returns a list of LSPs based on to which device they are headed.
   * Also return the count of incoming and outcoming tunnels from / to that device.
   */
  mplsLspCount: Maybe<Array<Maybe<MplsTotalLsps>>>;
  /** Read network devices that match specified filter. */
  netDevices: NetDeviceConnection;
  /**
   * Find routing paths between two network devices in the network topology.
   * Routing paths are ordered from the shortest to the longest based on the summarized weights.
   */
  netRoutingPaths: Maybe<NetRoutingPathConnection>;
  /**
   * Read node by its unique object identifier.
   * Example subtypes of Node interface: PhyDevice, PhyInterface, NetDevice, NetInterface, NetNetwork.
   */
  node: Maybe<Node>;
  /** Read physical devices that match specified filter. */
  phyDevices: PhyDeviceConnection;
  /** Read list of support device types in the specified topology. */
  provider: ProviderResponse;
  /** Read list of available topology providers (e.g. physical, etp, eth_sync, etc.). */
  providers: Array<Scalars['String']>;
  /** Read ptp devices that match specified filter. */
  ptpDevices: PtpDeviceConnection;
  /**
   * Find devices that have different upstream path in PTP topology vs SyncE topology.
   * Return a list of PTP nodes that:
   * - do not have SyncE setup
   * - use different parent node in SyncE
   * - use different interface towards parent node in SyncE
   */
  ptpDiffSynce: PtpDiffSynceConnection;
  /**
   * Find path between selected PTP device clock and its current grandmaster clock.
   * If synced PTP topology does not contain active path from specified device to grandmaster, empty path is returned.
   * If invalid device identifier is specified, error is returned.
   */
  ptpPathToGmClock: PtpPath;
  /** Read synce devices that match specified filter. */
  synceDevices: SynceDeviceConnection;
  /**
   * Find path between selected SYNCE device and its current grandmaster.
   * If synced SYNCED topology does not contain active path from specified device to grandmaster, empty path is returned.
   * If invalid device identifier is specified, error is returned.
   */
  syncePathToGm: SyncePath;
  /**
   * Computation of the diff between two databases per collections - created, deleted, and changed entries.
   * Only documents that belong to the specified topology are included in the diff.
   */
  topologyDiff: TopologyResponse;
};


export type QueryCommonNodesArgs = {
  db_name?: InputMaybe<Scalars['String']>;
  selected_nodes: Array<Scalars['String']>;
  topology_type?: InputMaybe<TopologyType>;
};


export type QueryDeviceMetadataArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<DeviceMetadataFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryMplsDevicesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<MplsDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryMplsLspCountArgs = {
  device_id: Scalars['ID'];
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


export type QueryProviderArgs = {
  name: Scalars['String'];
};


export type QueryPtpDevicesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PtpDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryPtpDiffSynceArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<PtpDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QueryPtpPathToGmClockArgs = {
  deviceFrom: Scalars['ID'];
  outputCollection?: InputMaybe<PtpPathOutputCollections>;
};


export type QuerySynceDevicesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<SynceDeviceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type QuerySyncePathToGmArgs = {
  deviceFrom: Scalars['ID'];
  outputCollection?: InputMaybe<SyncePathOutputCollections>;
};


export type QueryTopologyDiffArgs = {
  collection_type: TopologyType;
  new_db: Scalars['String'];
  old_db: Scalars['String'];
};

/** Computed routing path from source to destination device. */
export type RoutingPath = {
  __typename?: 'RoutingPath';
  /** Ordered list of nodes that compose path from source to destination device. */
  nodes: Array<NodeInfo>;
  /** Total weight of the path. */
  weight: Scalars['Int'];
};

export type Signalisation =
  | 'LDP'
  | 'RSVP';

/** Response from the sync query that contains information about synced devices from the network to topology. */
export type SyncResponse = {
  __typename?: 'SyncResponse';
  /**
   * List of devices that are installed in UniConfig but are missing their metadata in DeviceMetadata collection in the
   * database.
   */
  devices_missing_in_inventory: Maybe<Array<Maybe<Scalars['String']>>>;
  /** List of devices that are not installed in UniConfig. */
  devices_missing_in_uniconfig: Maybe<Array<Maybe<Scalars['String']>>>;
  /**
   * List of string labels that are used for grouping of synced devices.
   * List content should be the same as the list of labels in the input of the sync query.
   */
  labels: Array<Scalars['String']>;
  /**
   * Dictionary of devices and neighbors that are successfully synced from network to target topology.
   * JSON format:
   * {
   *   "R1": [
   *     {
   *       "from_interface": "GigabitEthernet0/0/0/0",
   *       "to_interface": "GigabitEthernet0/0/0/0",
   *       "to_device": "R7"
   *     },
   *     {
   *       "from_interface": "GigabitEthernet0/0/0/1",
   *       "to_interface": "GigabitEthernet0/0/0/1",
   *       "to_device": "R2"
   *     }
   *   ],
   *   "R2": [
   *     {
   *       "from_interface": "GigabitEthernet0/0/0/0",
   *       "to_interface": "GigabitEthernet0/0/0/0",
   *       "to_device": "R3"
   *     }
   *   ]
   * }
   */
  loaded_devices: Scalars['JSON'];
};

/** Representation of the device in the synce topology. */
export type SynceDevice = Node & {
  __typename?: 'SynceDevice';
  /** Coordinates of the device node on the graph. */
  coordinates: Coordinates;
  /** Details of the device. */
  details: SynceDeviceDetails;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** List of strings that can be used for grouping of synced devices. */
  labels: Maybe<Array<Scalars['String']>>;
  /** Human readable name of the device. */
  name: Scalars['String'];
  /** Status of the device from the view of the synced topology. */
  status: NodeStatus;
  /** List of ports that are present on the device. */
  synceInterfaces: SynceInterfaceConnection;
};


/** Representation of the device in the synce topology. */
export type SynceDeviceSynceInterfacesArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  filters?: InputMaybe<SynceInterfaceFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of SynceDevice objects and pagination metadata. */
export type SynceDeviceConnection = {
  __typename?: 'SynceDeviceConnection';
  /** List of SynceDevice objects. */
  edges: Maybe<Array<Maybe<SynceDeviceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details specific to SyncE (Synchronous Ethernet). */
export type SynceDeviceDetails = {
  __typename?: 'SynceDeviceDetails';
  /** Identifier of the reference (for example, source interface) that is used to synchronize the clock. */
  selected_for_use: Maybe<Scalars['String']>;
};

/** Grouped SynceDevice object and associated cursor used by pagination. */
export type SynceDeviceEdge = {
  __typename?: 'SynceDeviceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated SynceDevice object. */
  node: Maybe<SynceDevice>;
};

/** Filter for SynceDevice type based on device label and device name. */
export type SynceDeviceFilter = {
  /** Device label. */
  label?: InputMaybe<Scalars['String']>;
  /** Regex of device name. */
  name?: InputMaybe<Scalars['String']>;
  /** Regex: identifier of the reference (for example, source interface) that is used to synchronize the clock. */
  selected_for_use?: InputMaybe<Scalars['String']>;
};

/** Port attached to the SyncE device. */
export type SynceInterface = Node & {
  __typename?: 'SynceInterface';
  /** Interface details specific to SyncE operation. */
  details: Maybe<SynceInterfaceDetails>;
  /** Unique identifier of the object. */
  id: Scalars['ID'];
  /** Human readable name of the network port. */
  name: Scalars['String'];
  /** Status of the interface from the view of the synced topology ('ok' or 'unknown'). */
  status: NodeStatus;
  /** Device that owns this interface. */
  synceDevice: Maybe<SynceDevice>;
  /** Link to connected remote synce device. */
  synceLinks: Maybe<SynceLinkConnection>;
};


/** Port attached to the SyncE device. */
export type SynceInterfaceSynceLinksArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['Int']>;
};

/** Grouped list of SynceInterface objects and pagination metadata. */
export type SynceInterfaceConnection = {
  __typename?: 'SynceInterfaceConnection';
  /** List of SynceInterface objects. */
  edges: Maybe<Array<Maybe<SynceInterfaceEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Details specific to SyncE (Synchronous Ethernet). */
export type SynceInterfaceDetails = {
  __typename?: 'SynceInterfaceDetails';
  /**
   * Information about why the interface is not qualified for SyncE synchronization
   * (set to 'unknown' if the interface is qualified).
   */
  not_qualified_due_to: Maybe<Scalars['String']>;
  /**
   * Information about why the interface is not selected for SyncE synchronization
   * (set to 'unknown' if the interface is selected).
   */
  not_selected_due_to: Maybe<Scalars['String']>;
  /** Statement of whether the interface is qualified for SyncE synchronization. */
  qualified_for_use: Maybe<Scalars['String']>;
  /** Quality of the received SyncE signal (for example, 'DNU' or 'PRC'). */
  rx_quality_level: Maybe<Scalars['String']>;
  /** Configured SyncE on the port. */
  synce_enabled: Maybe<Scalars['Boolean']>;
};

/** Grouped SynceInterface object and associated cursor used by pagination. */
export type SynceInterfaceEdge = {
  __typename?: 'SynceInterfaceEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** The associated SynceInterface object. */
  node: Maybe<SynceInterface>;
};

/** Filter for SynceInterface type based on the current interface status and name of the device. */
export type SynceInterfaceFilter = {
  /** Regex of interface name. */
  name?: InputMaybe<Scalars['String']>;
  /** Regex: Information about why the interface is not qualified for SyncE synchronization. */
  not_qualified_due_to?: InputMaybe<Scalars['String']>;
  /** Regex: Information about why the interface is not selected for SyncE synchronization. */
  not_selected_due_to?: InputMaybe<Scalars['String']>;
  /** Regex: Statement of whether the interface is qualified for SyncE synchronization. */
  qualified_for_use?: InputMaybe<Scalars['String']>;
  /** Regex: Quality of the received SyncE signal (for example, 'DNU' or 'PRC'). */
  rx_quality_level?: InputMaybe<Scalars['String']>;
  /** Status of the interface from the view of the synced topology. */
  status?: InputMaybe<NodeStatus>;
  /** Configured SyncE on the port. */
  synce_enabled?: InputMaybe<Scalars['Boolean']>;
};

/** Grouped list of SynceLinks objects and pagination metadata. */
export type SynceLinkConnection = {
  __typename?: 'SynceLinkConnection';
  /** List of SynceInterface objects. */
  edges: Maybe<Array<Maybe<SynceLinkEdge>>>;
  /** Pagination metadata. */
  pageInfo: PageInfo;
};

/** Grouped SynceLink object and associated cursor used by pagination. */
export type SynceLinkEdge = {
  __typename?: 'SynceLinkEdge';
  /** Pagination cursor for this edge. */
  cursor: Scalars['String'];
  /** Identifier of the link that connects this interface to the interface on the remote device */
  link: Maybe<Scalars['ID']>;
  /** The associated SynceInterface object. */
  node: Maybe<SynceInterface>;
};

/** Computed path from source to destination SYNCE device. */
export type SyncePath = {
  __typename?: 'SyncePath';
  /** True if path is complete - the last element in the path represents GM, False otherwise. */
  complete: Scalars['Boolean'];
  /** Ordered list of node identifiers that compose path from source device to destination device. */
  nodes: Maybe<Array<Scalars['ID']>>;
};

/** Types of the nodes that should be included in the returned path. */
export type SyncePathOutputCollections =
  /** Include SynceDevice nodes in the returned path. */
  | 'SynceDevice'
  /** Include SynceInterface nodes in the returned path. */
  | 'SynceInterface';

/** Response from the topologyDiff query that contains diff between two databases. */
export type TopologyResponse = {
  __typename?: 'TopologyResponse';
  /**
   * Created diff between two databases. Format of the output JSON ('data' represents database document):
   * {
   *     "added": {"PhyDevice": [{data}], "PhyInterface": [], ...},
   *     "deleted": {"PhyDevice": [{data}], "PhyInterface": [], ...},
   *     "changed": {"PhyDevice": [{"new": {data}, "old"}: {data}], "PhyInterface": [{"new": {data}, "old": {data}], ...}
   * }
   */
  diff_data: Maybe<Scalars['JSON']>;
};

/** Present topology types. */
export type TopologyType =
  | 'EthTopology'
  | 'MplsTopology'
  | 'NetworkTopology'
  | 'PhysicalTopology'
  | 'PtpTopology';

export type GetShortestPathQueryVariables = Exact<{
  deviceFrom: Scalars['ID'];
  deviceTo: Scalars['ID'];
  collection?: InputMaybe<NetRoutingPathOutputCollections>;
}>;


export type GetShortestPathQuery = { __typename?: 'Query', netRoutingPaths: { __typename?: 'NetRoutingPathConnection', edges: Array<{ __typename?: 'RoutingPath', weight: number, nodes: Array<{ __typename?: 'NodeInfo', node: string, weight: number | null }> }> | null } | null };

export type TopologyDevicesQueryVariables = Exact<{ [key: string]: never; }>;


export type TopologyDevicesQuery = { __typename?: 'Query', phyDevices: { __typename?: 'PhyDeviceConnection', edges: Array<{ __typename?: 'PhyDeviceEdge', node: { __typename?: 'PhyDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, routerId: string | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'PhyDeviceDetails', sw_version: string | null, device_type: string | null }, phyInterfaces: { __typename?: 'PhyInterfaceConnection', edges: Array<{ __typename?: 'PhyInterfaceEdge', node: { __typename?: 'PhyInterface', id: string, name: string, status: NodeStatus, phyLinks: { __typename?: 'PhyLinkConnection', edges: Array<{ __typename?: 'PhyLinkEdge', link: string | null, node: { __typename?: 'PhyInterface', id: string, name: string, phyDevice: { __typename?: 'PhyDevice', id: string, name: string } | null } | null } | null> | null } } | null } | null> | null } } | null } | null> | null } };

export type NetTopologyQueryVariables = Exact<{ [key: string]: never; }>;


export type NetTopologyQuery = { __typename?: 'Query', netDevices: { __typename?: 'NetDeviceConnection', edges: Array<{ __typename?: 'NetDeviceEdge', cursor: string, node: { __typename?: 'NetDevice', id: string, routerId: string, ospfAreaId: string, phyDevice: { __typename?: 'PhyDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, routerId: string | null, details: { __typename?: 'PhyDeviceDetails', device_type: string | null, sw_version: string | null }, coordinates: { __typename?: 'Coordinates', x: number, y: number } } | null, netInterfaces: { __typename?: 'NetInterfaceConnection', edges: Array<{ __typename?: 'NetInterfaceEdge', cursor: string, node: { __typename?: 'NetInterface', id: string, ipAddress: string, netDevice: { __typename?: 'NetDevice', id: string, routerId: string } | null, netLinks: { __typename?: 'NetLinkConnection', edges: Array<{ __typename?: 'NetLinkEdge', link: string | null, node: { __typename?: 'NetInterface', id: string, igp_metric: number | null, netDevice: { __typename?: 'NetDevice', id: string, routerId: string } | null } | null } | null> | null } } | null } | null> | null }, netNetworks: { __typename?: 'NetNetworkConnection', edges: Array<{ __typename?: 'NetNetworkEdge', cursor: string, node: { __typename?: 'NetNetwork', id: string, subnet: string, ospfRouteType: number, coordinates: { __typename?: 'Coordinates', x: number, y: number } } | null } | null> | null, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor: string | null } | null } } | null } | null> | null } };

export type GetBackupsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackupsQuery = { __typename?: 'Query', backups: Array<string> };

export type TopologyDiffQueryVariables = Exact<{
  new_db: Scalars['String'];
  old_db: Scalars['String'];
  collection_type: TopologyType;
}>;


export type TopologyDiffQuery = { __typename?: 'Query', topologyDiff: { __typename?: 'TopologyResponse', diff_data: any | null } };

export type PtpDiffSynceQueryVariables = Exact<{ [key: string]: never; }>;


export type PtpDiffSynceQuery = { __typename?: 'Query', ptpDiffSynce: { __typename?: 'PtpDiffSynceConnection', edges: Array<{ __typename?: 'PtpDiffSynceEdge', node: { __typename?: 'PtpDiffSynce', id: string } | null } | null> | null } };

export type GetCommonNodesQueryVariables = Exact<{
  selectedNodes: Array<Scalars['String']> | Scalars['String'];
}>;


export type GetCommonNodesQuery = { __typename?: 'Query', commonNodes: { __typename?: 'CommonNodesResponse', common_nodes: Array<string> } };

export type UpdateCoordinatesMutationVariables = Exact<{
  coordinates: Array<CoordinatesInput> | CoordinatesInput;
  topology_type?: InputMaybe<TopologyType>;
}>;


export type UpdateCoordinatesMutation = { __typename?: 'Mutation', updateCoordinates: { __typename?: 'CoordinatesResponse', not_installed: Array<string>, installed: { __typename?: 'InstalledDevices', not_updated: Array<string>, updated: Array<string> } } };

export type PtpDevicePartsFragment = { __typename?: 'PtpDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'PtpDeviceDetails', clock_type: string | null, domain: number | null, ptp_profile: string | null, clock_id: string | null, parent_clock_id: string | null, gm_clock_id: string | null, clock_class: number | null, clock_accuracy: string | null, clock_variance: string | null, time_recovery_status: string | null, global_priority: number | null, user_priority: number | null }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', cursor: string, node: { __typename?: 'PtpInterface', id: string, name: string, status: NodeStatus, details: { __typename?: 'PtpInterfaceDetails', ptp_status: string, ptsf_unusable: string, admin_oper_status: string } | null, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, ptpDevice: { __typename?: 'PtpDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', node: { __typename?: 'PtpInterface', id: string, name: string, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, name: string } | null } | null> | null } } | null } | null> | null } } | null } | null } | null> | null } } | null } | null> | null } };

export type PtpInterfaceDevicePartsFragment = { __typename?: 'PtpDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', node: { __typename?: 'PtpInterface', id: string, name: string, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, name: string } | null } | null> | null } } | null } | null> | null } };

export type PtpInterfacePartsFragment = { __typename?: 'PtpInterface', id: string, name: string, status: NodeStatus, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, ptpDevice: { __typename?: 'PtpDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', node: { __typename?: 'PtpInterface', id: string, name: string, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, name: string } | null } | null> | null } } | null } | null> | null } } | null } | null } | null> | null } };

export type PtpTopologyQueryVariables = Exact<{ [key: string]: never; }>;


export type PtpTopologyQuery = { __typename?: 'Query', ptpDevices: { __typename?: 'PtpDeviceConnection', edges: Array<{ __typename?: 'PtpDeviceEdge', cursor: string, node: { __typename?: 'PtpDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'PtpDeviceDetails', clock_type: string | null, domain: number | null, ptp_profile: string | null, clock_id: string | null, parent_clock_id: string | null, gm_clock_id: string | null, clock_class: number | null, clock_accuracy: string | null, clock_variance: string | null, time_recovery_status: string | null, global_priority: number | null, user_priority: number | null }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', cursor: string, node: { __typename?: 'PtpInterface', id: string, name: string, status: NodeStatus, details: { __typename?: 'PtpInterfaceDetails', ptp_status: string, ptsf_unusable: string, admin_oper_status: string } | null, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, ptpDevice: { __typename?: 'PtpDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, ptpInterfaces: { __typename?: 'PtpInterfaceConnection', edges: Array<{ __typename?: 'PtpInterfaceEdge', node: { __typename?: 'PtpInterface', id: string, name: string, ptpLinks: { __typename?: 'PtpLinkConnection', edges: Array<{ __typename?: 'PtpLinkEdge', link: string | null, node: { __typename?: 'PtpInterface', id: string, name: string } | null } | null> | null } } | null } | null> | null } } | null } | null } | null> | null } } | null } | null> | null } } | null } | null> | null } };

export type PtpPathToGrandMasterQueryVariables = Exact<{
  deviceFrom: Scalars['ID'];
}>;


export type PtpPathToGrandMasterQuery = { __typename?: 'Query', ptpPathToGmClock: { __typename?: 'PtpPath', nodes: Array<string> | null } };

export type SynceDevicePartsFragment = { __typename?: 'SynceDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'SynceDeviceDetails', selected_for_use: string | null }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', cursor: string, node: { __typename?: 'SynceInterface', id: string, name: string, status: NodeStatus, details: { __typename?: 'SynceInterfaceDetails', synce_enabled: boolean | null, rx_quality_level: string | null, qualified_for_use: string | null, not_qualified_due_to: string | null, not_selected_due_to: string | null } | null, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null } | null } | null> | null } };

export type SynceInterfaceDevicePartsFragment = { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } };

export type SynceInterfacePartsFragment = { __typename?: 'SynceInterface', id: string, name: string, status: NodeStatus, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null };

export type SynceTopologyQueryVariables = Exact<{ [key: string]: never; }>;


export type SynceTopologyQuery = { __typename?: 'Query', synceDevices: { __typename?: 'SynceDeviceConnection', edges: Array<{ __typename?: 'SynceDeviceEdge', cursor: string, node: { __typename?: 'SynceDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, details: { __typename?: 'SynceDeviceDetails', selected_for_use: string | null }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', cursor: string, node: { __typename?: 'SynceInterface', id: string, name: string, status: NodeStatus, details: { __typename?: 'SynceInterfaceDetails', synce_enabled: boolean | null, rx_quality_level: string | null, qualified_for_use: string | null, not_qualified_due_to: string | null, not_selected_due_to: string | null } | null, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, synceDevice: { __typename?: 'SynceDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, synceInterfaces: { __typename?: 'SynceInterfaceConnection', edges: Array<{ __typename?: 'SynceInterfaceEdge', node: { __typename?: 'SynceInterface', id: string, name: string, synceLinks: { __typename?: 'SynceLinkConnection', edges: Array<{ __typename?: 'SynceLinkEdge', link: string | null, node: { __typename?: 'SynceInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null } | null } | null> | null } } | null } | null> | null } };

export type SyncePathToGrandMasterQueryVariables = Exact<{
  deviceFrom: Scalars['ID'];
}>;


export type SyncePathToGrandMasterQuery = { __typename?: 'Query', syncePathToGm: { __typename?: 'SyncePath', nodes: Array<string> | null } };

export type DeviceMetadataQueryVariables = Exact<{
  filters?: InputMaybe<DeviceMetadataFilter>;
}>;


export type DeviceMetadataQuery = { __typename?: 'Query', deviceMetadata: { __typename?: 'MetadataConnection', edges: Array<{ __typename?: 'DeviceMetadataEdge', node: { __typename?: 'DeviceMetadata', id: string, deviceName: string, deviceType: string | null, model: string | null, vendor: string | null, version: string | null, protocolType: string | null, geoLocation: { __typename?: 'DeviceGeoLocation', bbox: Array<number | null> | null, coordinates: Array<number>, type: GeometryType } | null } | null } | null> | null } };

export type MplsDevicePartsFragment = { __typename?: 'MplsDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, status: NodeStatus, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null } | null } | null> | null }, details: { __typename?: 'MplsDeviceDetails', router_id: string | null, mpls_data: Array<{ __typename?: 'MplsData', lsp_id: string, in_label: number | null, in_interface: string | null, out_interface: string | null, out_label: number | null, ldp_prefix: string | null, mpls_operation: MplsOperation | null, oper_state: string | null, signalisation: Signalisation | null } | null> | null, lsp_tunnels: Array<{ __typename?: 'LspTunnel', lsp_id: string, from_device: string | null, to_device: string | null, signalisation: Signalisation, uptime: number | null } | null> | null } };

export type MplsInterfaceDevicePartsFragment = { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } };

export type MplsInterfacePartsFragment = { __typename?: 'MplsInterface', id: string, name: string, status: NodeStatus, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null };

export type MplsTopologyQueryVariables = Exact<{ [key: string]: never; }>;


export type MplsTopologyQuery = { __typename?: 'Query', mplsDevices: { __typename?: 'MplsDeviceConnection', edges: Array<{ __typename?: 'MplsDeviceEdge', cursor: string, node: { __typename?: 'MplsDevice', id: string, name: string, status: NodeStatus, labels: Array<string> | null, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, status: NodeStatus, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, mplsDevice: { __typename?: 'MplsDevice', id: string, name: string, coordinates: { __typename?: 'Coordinates', x: number, y: number }, mplsInterfaces: { __typename?: 'MplsInterfaceConnection', edges: Array<{ __typename?: 'MplsInterfaceEdge', node: { __typename?: 'MplsInterface', id: string, name: string, mplsLinks: { __typename?: 'MplsLinkConnection', edges: Array<{ __typename?: 'MplsLinkEdge', link: string | null, node: { __typename?: 'MplsInterface', id: string, name: string } | null } | null> | null } | null } | null } | null> | null } } | null } | null } | null> | null } | null } | null } | null> | null }, details: { __typename?: 'MplsDeviceDetails', router_id: string | null, mpls_data: Array<{ __typename?: 'MplsData', lsp_id: string, in_label: number | null, in_interface: string | null, out_interface: string | null, out_label: number | null, ldp_prefix: string | null, mpls_operation: MplsOperation | null, oper_state: string | null, signalisation: Signalisation | null } | null> | null, lsp_tunnels: Array<{ __typename?: 'LspTunnel', lsp_id: string, from_device: string | null, to_device: string | null, signalisation: Signalisation, uptime: number | null } | null> | null } } | null } | null> | null } };

export type MplsLspCountQueryVariables = Exact<{
  deviceId: Scalars['ID'];
}>;


export type MplsLspCountQuery = { __typename?: 'Query', mplsLspCount: Array<{ __typename?: 'MplsTotalLsps', to_device: string | null, incoming_lsps: number | null, outcoming_lsps: number | null } | null> | null };
