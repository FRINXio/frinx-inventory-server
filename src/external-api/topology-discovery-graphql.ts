import { GraphQLClient, gql } from 'graphql-request';
import config from '../config';
import {
  CoordinatesInput,
  GetBackupsQuery,
  GetCommonNodesQuery,
  GetCommonNodesQueryVariables,
  GetShortestPathQuery,
  GetShortestPathQueryVariables,
  NetTopologyQuery,
  PtpDiffSynceQuery,
  PtpPathToGrandMasterQuery,
  PtpPathToGrandMasterQueryVariables,
  PtpTopologyQuery,
  TopologyDevicesQuery,
  TopologyDiffQuery,
  TopologyDiffQueryVariables,
  TopologyType,
  UpdateCoordinatesMutation,
  UpdateCoordinatesMutationVariables,
  SynceTopologyQuery,
  SyncePathToGrandMasterQuery,
  SyncePathToGrandMasterQueryVariables,
  DeviceMetadataQuery,
  DeviceMetadataQueryVariables,
  MplsTopologyQuery,
  MplsLspCountQuery,
  MplsLspCountQueryVariables,
  NeighborsQuery,
  NeighborsQueryVariables,
} from '../__generated__/topology-discovery.graphql';
import { TopologyDiffOutput, decodeTopologyDiffOutput } from './topology-network-types';

type CoordinatesParam = {
  device: string;
  x: number;
  y: number;
};

type DeviceMetadataFilters = {
  deviceName?: string | null;
  topologyType?: 'PHYSICAL_TOPOLOGY' | 'PTP_TOPOLOGY' | 'ETH_TOPOLOGY' | 'NETWORK_TOPOLOGY' | 'MPLS_TOPOLOGY' | null;
  polygon?: number[][][] | null;
};

const GET_SHORTEST_PATH = gql`
  query GetShortestPath($deviceFrom: ID!, $deviceTo: ID!, $collection: NetRoutingPathOutputCollections) {
    netRoutingPaths(deviceFrom: $deviceFrom, deviceTo: $deviceTo, outputCollection: $collection) {
      edges {
        weight
        nodes {
          node
          weight
        }
      }
    }
  }
`;

const GET_TOPOLOGY_DEVICES = gql`
  query topologyDevices {
    phyDevices {
      edges {
        node {
          id
          name
          status
          labels
          routerId
          coordinates {
            x
            y
          }
          details {
            swVersion
            deviceType
          }
          phyInterfaces {
            edges {
              node {
                id
                name
                status
                phyLinks {
                  edges {
                    link
                    node {
                      id
                      name
                      phyDevice {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_NET_TOPOLOGY_DEVICES = gql`
  query NetTopology {
    netDevices {
      edges {
        cursor
        node {
          id
          routerId
          ospfAreaId
          phyDevice {
            id
            name
            status
            details {
              deviceType
              swVersion
            }
            labels
            routerId
            coordinates {
              x
              y
            }
          }
          netInterfaces {
            edges {
              cursor
              node {
                id
                ipAddress
                netDevice {
                  id
                  routerId
                }
                netLinks {
                  edges {
                    link
                    node {
                      id
                      igp_metric
                      netDevice {
                        id
                        routerId
                      }
                    }
                  }
                }
              }
            }
          }
          netNetworks {
            edges {
              cursor
              node {
                id
                subnet
                ospfRouteType
                coordinates {
                  x
                  y
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  }
`;

const GET_BACKUPS = gql`
  query GetBackups {
    backups
  }
`;

const GET_TOPOLOGY_DIFF = gql`
  query topologyDiff($new_db: String!, $old_db: String!, $collection_type: TopologyType!) {
    topologyDiff(newDb: $new_db, oldDb: $old_db, collectionType: $collection_type) {
      diffData
    }
  }
`;

const GET_PTP_DIFF_SYNCE = gql`
  query ptpDiffSynce {
    ptpDiffSynce {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const GET_COMMON_NODES = gql`
  query getCommonNodes($selectedNodes: [String!]!) {
    commonNodes(selectedNodes: $selectedNodes) {
      commonNodes
    }
  }
`;

const UPDATE_COORDINATES = gql`
  mutation UpdateCoordinates($coordinates: [CoordinatesInput!]!, $topology_type: TopologyType) {
    updateCoordinates(coordinatesList: $coordinates, topologyType: $topology_type) {
      notInstalled
      installed {
        notUpdated
        updated
      }
    }
  }
`;

const PTP_TOPOLOGY = gql`
  fragment PtpDeviceParts on PtpDevice {
    id
    name
    coordinates {
      x
      y
    }
    details {
      clockType
      domain
      ptpProfile
      clockId
      parentClockId
      gmClockId
      clockClass
      clockAccuracy
      clockVariance
      timeRecoveryStatus
      globalPriority
      userPriority
    }
    status
    labels
    ptpInterfaces {
      edges {
        cursor
        node {
          ...PtpInterfaceParts
          details {
            ptpStatus
            ptsfUnusable
            adminOperStatus
          }
        }
      }
    }
  }

  fragment PtpInterfaceDeviceParts on PtpDevice {
    id
    name
    coordinates {
      x
      y
    }
    ptpInterfaces {
      edges {
        node {
          id
          name
          ptpLinks {
            edges {
              link
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }

  fragment PtpInterfaceParts on PtpInterface {
    id
    name
    status
    ptpLinks {
      edges {
        link
        node {
          id
          ptpDevice {
            ...PtpInterfaceDeviceParts
          }
        }
      }
    }
  }

  query PtpTopology {
    ptpDevices {
      edges {
        cursor
        node {
          ...PtpDeviceParts
        }
      }
    }
  }
`;

const PTP_PATH = gql`
  query PtpPathToGrandMaster($deviceFrom: ID!) {
    ptpPathToGmClock(deviceFrom: $deviceFrom) {
      nodes
    }
  }
`;

const SYNCE_TOPOLOGY = gql`
  fragment SynceDeviceParts on SynceDevice {
    id
    name
    coordinates {
      x
      y
    }
    details {
      selectedForUse
    }
    status
    labels
    synceInterfaces {
      edges {
        cursor
        node {
          ...SynceInterfaceParts
          details {
            synceEnabled
            rxQualityLevel
            qualifiedForUse
            notQualifiedDueTo
            notSelectedDueTo
          }
        }
      }
    }
  }

  fragment SynceInterfaceDeviceParts on SynceDevice {
    id
    name
    coordinates {
      x
      y
    }
    synceInterfaces {
      edges {
        node {
          id
          name
          synceLinks {
            edges {
              link
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }

  fragment SynceInterfaceParts on SynceInterface {
    id
    name
    status
    synceDevice {
      ...SynceInterfaceDeviceParts
    }
    synceLinks {
      edges {
        link
        node {
          id
          synceDevice {
            ...SynceInterfaceDeviceParts
          }
        }
      }
    }
  }

  query SynceTopology {
    synceDevices {
      edges {
        cursor
        node {
          ...SynceDeviceParts
        }
      }
    }
  }
`;

const SYNCE_PATH = gql`
  query SyncePathToGrandMaster($deviceFrom: ID!) {
    syncePathToGm(deviceFrom: $deviceFrom) {
      nodes
    }
  }
`;

const DEVICE_METADATA = gql`
  query DeviceMetadata($filters: DeviceMetadataFilter) {
    deviceMetadata(filters: $filters) {
      edges {
        node {
          id
          deviceName
          deviceType
          model
          vendor
          version
          protocolType
          geoLocation {
            bbox
            coordinates
            type
          }
        }
      }
    }
  }
`;

const MPLS_TOPOLOGY = gql`
  fragment MplsDeviceParts on MplsDevice {
    id
    name
    status
    labels
    coordinates {
      x
      y
    }
    mplsInterfaces {
      edges {
        node {
          ...MplsInterfaceParts
        }
      }
    }
    details {
      routerId
      mplsData {
        lspId
        inLabel
        inInterface
        outInterface
        outLabel
        mplsOperation
        operState
        signalisation
      }
      lspTunnels {
        lspId
        fromDevice
        toDevice
        signalisation
        uptime
      }
    }
  }

  fragment MplsInterfaceDeviceParts on MplsDevice {
    id
    name
    coordinates {
      x
      y
    }
    mplsInterfaces {
      edges {
        node {
          id
          name
          mplsLinks {
            edges {
              link
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }

  fragment MplsInterfaceParts on MplsInterface {
    id
    name
    status
    mplsDevice {
      ...MplsInterfaceDeviceParts
    }
    mplsLinks {
      edges {
        link
        node {
          id
          mplsDevice {
            ...MplsInterfaceDeviceParts
          }
        }
      }
    }
  }

  query MplsTopology {
    mplsDevices {
      edges {
        cursor
        node {
          ...MplsDeviceParts
        }
      }
    }
  }
`;

const MPLS_LSP_COUNT = gql`
  query MplsLspCount($deviceId: ID!) {
    mplsLspCount(deviceId: $deviceId) {
      toDevice
      incomingLsps
      outcomingLsps
    }
  }
`;

const MAP_NEIGHBORS = gql`
  query Neighbors($deviceName: String!, $topologyType: TopologyType!) {
    neighbors(deviceName: $deviceName, topologyType: $topologyType) {
      deviceId
      deviceName
    }
  }
`;

function getTopologyDiscoveryApi() {
  if (!config.topologyEnabled) {
    return undefined;
  }

  const client = new GraphQLClient(config.topologyDiscoveryGraphqlURL);

  async function getShortestPath(from: string, to: string): Promise<GetShortestPathQuery> {
    const response = await client.request<GetShortestPathQuery, GetShortestPathQueryVariables>(GET_SHORTEST_PATH, {
      deviceFrom: from,
      deviceTo: to,
      collection: 'NET_INTERFACE',
    });

    return response;
  }

  async function getTopologyDevices(): Promise<TopologyDevicesQuery> {
    const response = await client.request<TopologyDevicesQuery>(GET_TOPOLOGY_DEVICES);

    return response;
  }

  async function getPtpDiffSynce(): Promise<PtpDiffSynceQuery> {
    const response = await client.request<PtpDiffSynceQuery>(GET_PTP_DIFF_SYNCE);

    return response;
  }

  async function getNetTopologyDevices(): Promise<NetTopologyQuery> {
    const response = await client.request<NetTopologyQuery>(GET_NET_TOPOLOGY_DEVICES);
    return response;
  }

  async function getBackups(): Promise<GetBackupsQuery> {
    const response = await client.request<GetBackupsQuery>(GET_BACKUPS);
    return response;
  }

  async function getTopologyDiff(version: string, collectionType: TopologyType): Promise<TopologyDiffOutput> {
    const response = await client.request<TopologyDiffQuery, TopologyDiffQueryVariables>(GET_TOPOLOGY_DIFF, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      new_db: 'current',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      old_db: version,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      collection_type: collectionType,
    });
    const json = decodeTopologyDiffOutput(response.topologyDiff.diffData);

    return json;
  }

  async function getCommonNodes(selectedNodes: string[]): Promise<string[]> {
    const response = await client.request<GetCommonNodesQuery, GetCommonNodesQueryVariables>(GET_COMMON_NODES, {
      selectedNodes,
    });

    return response.commonNodes.commonNodes;
  }

  async function updateCoordinates(coordinates: CoordinatesParam[], topologyType?: TopologyType): Promise<string[]> {
    const coordinatesInput: CoordinatesInput[] = coordinates.map((c) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      nodeName: c.device,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      nodeType: 'DEVICE',
      x: c.x,
      y: c.y,
    }));
    const response = await client.request<UpdateCoordinatesMutation, UpdateCoordinatesMutationVariables>(
      UPDATE_COORDINATES,
      {
        coordinates: coordinatesInput,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        topology_type: topologyType,
      },
    );

    return response.updateCoordinates.installed.updated;
  }

  async function getPtpTopology(): Promise<PtpTopologyQuery> {
    const response = await client.request<PtpTopologyQuery>(PTP_TOPOLOGY);

    return response;
  }

  async function getPtpPathToGrandMaster(deviceFrom: string): Promise<string[] | null> {
    const response = await client.request<PtpPathToGrandMasterQuery, PtpPathToGrandMasterQueryVariables>(PTP_PATH, {
      deviceFrom,
    });

    return response.ptpPathToGmClock.nodes;
  }

  async function getSynceTopology(): Promise<SynceTopologyQuery> {
    const response = await client.request<SynceTopologyQuery>(SYNCE_TOPOLOGY);

    return response;
  }

  async function getMapNeighbors(deviceName: string, topologyType: TopologyType): Promise<NeighborsQuery> {
    const response = await client.request<NeighborsQuery, NeighborsQueryVariables>(MAP_NEIGHBORS, {
      deviceName,
      topologyType,
    });

    return response;
  }

  async function getSyncePathToGrandMaster(deviceFrom: string): Promise<string[] | null> {
    const response = await client.request<SyncePathToGrandMasterQuery, SyncePathToGrandMasterQueryVariables>(
      SYNCE_PATH,
      {
        deviceFrom,
      },
    );

    return response.syncePathToGm.nodes;
  }

  async function getDeviceMetadata(filters?: DeviceMetadataFilters): Promise<DeviceMetadataQuery> {
    const filter: DeviceMetadataFilters = {};

    if (filters?.deviceName != null) {
      filter.deviceName = filters.deviceName;
    }

    if (filters?.topologyType != null) {
      filter.topologyType = filters.topologyType;
    }

    if (filters?.polygon != null) {
      filter.polygon = filters.polygon;
    }

    const response = await client.request<DeviceMetadataQuery, DeviceMetadataQueryVariables>(DEVICE_METADATA, {
      filters: filter,
    });
    return response;
  }

  async function getMplsTopology(): Promise<MplsTopologyQuery> {
    const response = await client.request<MplsTopologyQuery>(MPLS_TOPOLOGY);

    return response;
  }

  async function getMplsLspCount(deviceId: string): Promise<MplsLspCountQuery> {
    const response = await client.request<MplsLspCountQuery, MplsLspCountQueryVariables>(MPLS_LSP_COUNT, {
      deviceId,
    });

    return response;
  }

  return {
    getTopologyDevices,
    getPtpDiffSynce,
    getNetTopologyDevices,
    getShortestPath,
    getBackups,
    getTopologyDiff,
    getCommonNodes,
    getPtpTopology,
    getPtpPathToGrandMaster,
    updateCoordinates,
    getSynceTopology,
    getSyncePathToGrandMaster,
    getDeviceMetadata,
    getMplsTopology,
    getMplsLspCount,
    getMapNeighbors,
  };
}

export type TopologyDiscoveryGraphQLAPI = ReturnType<typeof getTopologyDiscoveryApi>;
export default getTopologyDiscoveryApi;
