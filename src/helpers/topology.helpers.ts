import { device as PrismaDevice } from '@prisma/client';
import {
  NetTopologyQuery,
  PhyDevice,
  PtpTopologyQuery,
  SynceTopologyQuery,
  TopologyDevicesQuery,
} from '../__generated__/topology-discovery.graphql';
import {
  ArangoDevice,
  ArangoEdge,
  ArangoEdgeWithStatus,
  EdgeWithStatus,
  Status,
  TopologyDiffOutput,
} from '../external-api/topology-network-types';
import { omitNullValue, unwrap } from './utils.helpers';
import { toGraphId } from './id-helper';

type FilterInput = {
  labelIds?: string[] | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
};

type PtpDeviceDetails = {
  clockType: string;
  domain: number;
  ptpProfile: string;
  clockId: string;
  parentClockId: string;
  gmClockId: string;
  clockClass: number | null;
  clockAccuracy: string | null;
  clockVariance: string | null;
  timeRecoveryStatus: string | null;
  globalPriority: number | null;
  userPriority: number | null;
};

type SynceDeviceDetails = {
  selectedForUse: string | null;
};

function getLabelsQuery(labelIds: string[]): Record<string, unknown> | undefined {
  return labelIds.length ? { some: { labelId: { in: labelIds } } } : undefined;
}
export function getFilterQuery(filter?: FilterInput | null): FilterQuery | undefined {
  if (!filter) {
    return undefined;
  }
  const { labelIds } = filter;
  return {
    label: getLabelsQuery(labelIds ?? []),
  };
}

export function getOldTopologyDevices(devices: ArangoDevice[], diffData: TopologyDiffOutput): ArangoDevice[] {
  const oldDevices = devices
    // filter devices added to current topology
    .filter((n) => !diffData.added.PhyDevice.find((d) => n._id === d._id))
    // add devices removed from current topology
    .concat(diffData.deleted.PhyDevice)
    // change devices from old topology
    .map((n) => {
      const changedDevice = diffData.changed.PhyDevice.find((d) => d.old._id === n._id);
      if (!changedDevice) {
        return n;
      }
      return changedDevice.old;
    });
  return oldDevices;
}

type PhyDeviceWithoutInterfaces = Omit<PhyDevice, 'phyInterfaces' | 'netDevice'>;

export function convertPhyDeviceToArangoDevice(phyDevice: PhyDeviceWithoutInterfaces): ArangoDevice {
  const { name, status, coordinates, details, labels } = phyDevice;
  return {
    _id: phyDevice.id,
    _key: phyDevice.id,
    coordinates,
    details,
    labels: labels ?? [],
    name,
    status,
  };
}

export function getNodesFromTopologyQuery(query: TopologyDevicesQuery): ArangoDevice[] {
  const nodes =
    query.phyDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertPhyDeviceToArangoDevice) ?? [];
  return nodes;
}

export function getEdgesFromTopologyQuery(query: TopologyDevicesQuery): ArangoEdge[] {
  const currentEdges = query.phyDevices.edges?.flatMap(
    (e) =>
      e?.node?.phyInterfaces.edges
        ?.map((i) => i?.node)
        .filter(omitNullValue)
        .map((i) => {
          if (!i.phyLink?.idLink) {
            return null;
          }
          return {
            _id: i.phyLink.idLink,
            _key: i.phyLink.idLink,
            _from: i.id,
            _to: i.phyLink.id,
          };
        })
        .filter(omitNullValue) ?? [],
  );
  return currentEdges ?? [];
}

export function getOldTopologyInterfaceEdges(
  interfaceEdges: ArangoEdgeWithStatus[],
  diffData: TopologyDiffOutput,
): ArangoEdgeWithStatus[] {
  const oldInterfaceEdges: ArangoEdgeWithStatus[] = interfaceEdges
    // filter has edges added to current topology
    .filter((e) => !diffData.added.PhyHas.find((h) => e._id === h._id))
    // filter edges pointing to added interfaces
    .filter((e) => !diffData.added.PhyInterface.find((i) => e._to === i._id))
    // filter edges pointing to added device
    .filter((e) => !diffData.added.PhyDevice.find((d) => e._from === d._id))
    // add has edges removed from current topology
    .concat(diffData.deleted.PhyHas)
    // change `PhyHas` edges from old topology
    .map((e) => {
      const changedEdge = diffData.changed.PhyHas.find((h) => h.old._id === e._id);
      if (!changedEdge) {
        return e;
      }
      return changedEdge.old;
    });
  return oldInterfaceEdges;
}

export function getOldTopologyConnectedEdges(connected: ArangoEdge[], diffData: TopologyDiffOutput): ArangoEdge[] {
  const oldConnected: ArangoEdge[] = connected
    // filter connected edges added to current topology
    .filter((e) => !diffData.added.PhyLink.find((c) => e._id === c._id))
    // filter edges pointing to added interfaces
    .filter((e) => !diffData.added.PhyInterface.find((i) => e._to === i._id))
    // add connected edges removed from current topology
    .concat(diffData.deleted.PhyLink)
    // change `PhyLink` edges from old topology
    .map((e) => {
      const changedEdge = diffData.changed.PhyLink.find((h) => h.old._id === e._id);
      if (!changedEdge) {
        return e;
      }
      return changedEdge.old;
    });
  return oldConnected;
}

export function makeInterfaceDeviceMap<T extends { _to: string; _from: string }>(edges: T[]): Record<string, string> {
  return edges.reduce((acc, curr, _, arr) => {
    const device = unwrap(arr.find((intfc) => intfc._to === curr._to)?._from);
    return {
      ...acc,
      [curr._to]: device,
    };
  }, {});
}

export function makeInterfaceNameMap<T extends { _id: string }>(
  interfaces: T[],
  getName: (value: T) => string,
): Record<string, string> {
  return interfaces.reduce(
    (acc, curr) => ({
      ...acc,
      [curr._id]: getName(curr),
    }),
    {},
  );
}

export type InterfaceMap = Record<string, { id: string; status: Status; name: string }[]>;

export function makeInterfaceMap(edges: EdgeWithStatus[], interfaceNameMap: Record<string, string>): InterfaceMap {
  return edges.reduce((acc, curr) => {
    const item = { id: curr._to, status: curr.status, name: interfaceNameMap[curr._to] };
    return {
      ...acc,
      [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], item] : [item],
    };
  }, {} as InterfaceMap);
}

export type NetInterfaceMap = Record<string, { id: string; name: string }[]>;

export function makeNetInterfaceMap<T extends { _from: string; _to: string }>(
  edges: T[],
  interfaceNameMap: Record<string, string>,
): NetInterfaceMap {
  return edges.reduce((acc, curr) => {
    const item = { id: curr._to, name: interfaceNameMap[curr._to] };
    return {
      ...acc,
      [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], item] : [item],
    };
  }, {} as NetInterfaceMap);
}

export function makeNodesMap<T extends { _id: string }>(
  nodes: T[],
  getName: (value: T) => string,
): Record<string, string> {
  return nodes.reduce(
    (acc, curr) => ({
      ...acc,
      [curr._id]: getName(curr),
    }),
    {} as Record<string, string>,
  );
}

function getStatus(status: string | undefined): 'ok' | 'unknown' {
  return status === 'ok' ? 'ok' : 'unknown';
}

export function makeTopologyNodes(dbDevices: PrismaDevice[], topologyDevices?: TopologyDevicesQuery) {
  if (!topologyDevices) {
    return [];
  }
  const nodes = dbDevices
    .map((device) => {
      const node = topologyDevices?.phyDevices.edges?.find((e) => e?.node?.name === device.name)?.node;
      if (node != null) {
        return {
          id: toGraphId('GraphNode', node.id),
          deviceType: node.details.device_type ?? null,
          softwareVersion: node.details.sw_version ?? null,
          device,
          interfaces:
            node.phyInterfaces.edges?.map((e) => ({
              id: unwrap(e?.node?.id),
              status: getStatus(e?.node?.status),
              name: unwrap(e?.node?.name),
            })) ?? [],
          coordinates: node.coordinates,
        };
      }
      return null;
    })
    .filter(omitNullValue);
  return nodes;
}

export function getTopologyInterfaces(topologyDevices: TopologyDevicesQuery) {
  return (
    topologyDevices.phyDevices.edges?.flatMap((e) => {
      const node = e?.node;
      if (!node) {
        return [];
      }
      const nodeInterfaces = node.phyInterfaces.edges
        ?.map((ie) => {
          const inode = ie?.node;
          if (!inode || !inode.phyLink) {
            return null;
          }
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.name,
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
}

export function getDeviceInterfaceEdges(topologyDevices: TopologyDevicesQuery): ArangoEdgeWithStatus[] {
  return (
    topologyDevices.phyDevices.edges?.flatMap(
      (d) =>
        d?.node?.phyInterfaces.edges?.map((i) => ({
          _id: `${d.node?.id}-${i?.node?.id}`,
          _key: i?.node?.phyLink?.id ?? '', // INFO: idHas was removed
          _from: d.node?.id ?? '',
          _to: i?.node?.id ?? '',
          status: d.node?.status ?? 'unknown',
        })) ?? [],
    ) ?? []
  );
}

export function makeTopologyEdges(topologyDevices?: TopologyDevicesQuery) {
  if (!topologyDevices) {
    return [];
  }

  return getTopologyInterfaces(topologyDevices).map((i) => ({
    id: i.phyLink?.idLink ?? '',
    source: {
      interface: i.id,
      nodeId: i.nodeId,
    },
    target: {
      interface: unwrap(i.phyLink?.id),
      nodeId: unwrap(i.phyLink?.phyDevice?.name),
    },
  }));
}

export function makeNetTopologyNodes(netTopologyDevices?: NetTopologyQuery) {
  return (
    netTopologyDevices?.netDevices.edges
      ?.map((e) => {
        const node = e?.node;
        if (!node) {
          return null;
        }
        return {
          id: toGraphId('GraphNode', node.id),
          nodeId: node.id,
          name: node.routerId,
          interfaces:
            node.netInterfaces.edges
              ?.map((i) => {
                const interfaceNode = i?.node;
                if (!interfaceNode) {
                  return null;
                }
                return {
                  id: interfaceNode.id,
                  name: interfaceNode.ipAddress,
                };
              })
              .filter(omitNullValue) ?? [],
          coordinates: node.phyDevice?.coordinates ?? { x: 0, y: 0 },
          networks:
            node.netNetworks.edges
              ?.map((n) => {
                const networkNode = n?.node;
                if (!networkNode) {
                  return null;
                }
                return {
                  id: networkNode.id,
                  subnet: networkNode.subnet,
                  coordinates: networkNode.coordinates,
                };
              })
              .filter(omitNullValue) ?? [],
        };
      })
      .filter(omitNullValue) ?? []
  );
}

function getEdgesFromTopologyDevices(topologyDevices: NetTopologyQuery['netDevices']['edges']) {
  return (
    topologyDevices
      ?.flatMap((e) => {
        const device = e?.node ?? null;
        if (!device) {
          return [];
        }

        return device.netInterfaces.edges
          ?.map((i) => {
            const deviceInterface = i?.node;
            if (!deviceInterface || !deviceInterface.netDevice || !deviceInterface.netLink?.netDevice) {
              return null;
            }

            return {
              id: `${deviceInterface.id}-${deviceInterface.netLink.id}`,
              weight: deviceInterface?.netLink?.igp_metric ?? null,
              source: {
                interface: deviceInterface.id,
                nodeId: deviceInterface.netDevice.routerId,
              },
              target: {
                interface: deviceInterface.netLink.id,
                nodeId: deviceInterface.netLink.netDevice.routerId,
              },
            };
          })
          .filter(omitNullValue);
      })
      .filter(omitNullValue) ?? []
  );
}

export function makeNetTopologyEdges(netTopologyDevices?: NetTopologyQuery) {
  return netTopologyDevices ? getEdgesFromTopologyDevices(netTopologyDevices.netDevices.edges) : [];
}

export function makePtpDeviceDetails(
  device: NonNullable<NonNullable<NonNullable<PtpTopologyQuery['ptpDevices']['edges']>[0]>['node']>,
): PtpDeviceDetails {
  return {
    clockType: device.details.clock_type,
    domain: device.details.domain,
    ptpProfile: device.details.ptp_profile,
    clockId: device.details.clock_id,
    parentClockId: device.details.parent_clock_id,
    gmClockId: device.details.gm_clock_id,
    clockClass: device.details.clock_class,
    clockAccuracy: device.details.clock_accuracy,
    clockVariance: device.details.clock_variance,
    timeRecoveryStatus: device.details.time_recovery_status,
    globalPriority: device.details.global_priority,
    userPriority: device.details.user_priority,
  };
}

export function makePtpTopologyNodes(ptpDevices?: PtpTopologyQuery) {
  return (
    ptpDevices?.ptpDevices.edges
      ?.map((e) => {
        const node = e?.node;
        if (!node) {
          return null;
        }
        return {
          id: toGraphId('GraphNode', node.id),
          nodeId: node.id,
          name: node.name,
          ptpDeviceDetails: makePtpDeviceDetails(node),
          status: getStatus(node.status),
          labels: node.labels?.map((l) => l) ?? [],
          interfaces:
            node.ptpInterfaces.edges
              ?.map((i) => {
                const interfaceNode = i?.node;
                if (!interfaceNode) {
                  return null;
                }
                return {
                  id: interfaceNode.id,
                  name: interfaceNode.name,
                  status: getStatus(interfaceNode.status),
                  details: {
                    ptpStatus: interfaceNode.details?.ptp_status ?? null,
                    adminOperStatus: interfaceNode.details?.admin_oper_status ?? null,
                    ptsfUnusable: interfaceNode.details?.ptsf_unusable ?? null,
                  },
                };
              })
              .filter(omitNullValue) ?? [],
          coordinates: node.coordinates ?? { x: 0, y: 0 },
        };
      })
      .filter(omitNullValue) ?? []
  );
}

export function makePtpTopologyEdges(ptpDevices?: PtpTopologyQuery) {
  return (
    ptpDevices?.ptpDevices.edges
      ?.flatMap((e) => {
        const device = e?.node ?? null;
        if (!device) {
          return [];
        }

        return device.ptpInterfaces.edges
          ?.map((i) => {
            const deviceInterface = i?.node;
            if (!deviceInterface || !deviceInterface.ptpLink || !deviceInterface.ptpLink.ptpDevice) {
              return null;
            }

            return {
              id: `${deviceInterface.id}-${deviceInterface.ptpLink.id}`,
              source: {
                interface: deviceInterface.id,
                nodeId: device.name,
              },
              target: {
                interface: deviceInterface.ptpLink.id,
                nodeId: deviceInterface.ptpLink.ptpDevice.name,
              },
            };
          })
          .filter(omitNullValue);
      })
      .filter(omitNullValue) ?? []
  );
}

export function makeSynceDeviceDetails(
  device: NonNullable<NonNullable<NonNullable<SynceTopologyQuery['synceDevices']['edges']>[0]>['node']>,
): SynceDeviceDetails {
  return {
    selectedForUse: device.details.selected_for_use,
  };
}

export function makeSynceTopologyNodes(synceDevices?: SynceTopologyQuery) {
  return (
    synceDevices?.synceDevices.edges
      ?.map((e) => {
        const node = e?.node;
        if (!node) {
          return null;
        }
        return {
          id: toGraphId('GraphNode', node.id),
          nodeId: node.id,
          name: node.name,
          synceDeviceDetails: makeSynceDeviceDetails(node),
          status: getStatus(node.status),
          labels: node.labels?.map((l) => l) ?? [],
          interfaces:
            node.synceInterfaces.edges
              ?.map((i) => {
                const interfaceNode = i?.node;
                if (!interfaceNode) {
                  return null;
                }
                return {
                  id: interfaceNode.id,
                  name: interfaceNode.name,
                  status: getStatus(interfaceNode.status),
                };
              })
              .filter(omitNullValue) ?? [],
          coordinates: node.coordinates ?? { x: 0, y: 0 },
        };
      })
      .filter(omitNullValue) ?? []
  );
}

export function makeSynceTopologyEdges(synceDevices?: SynceTopologyQuery) {
  return (
    synceDevices?.synceDevices.edges
      ?.flatMap((e) => {
        const device = e?.node ?? null;
        if (!device) {
          return [];
        }

        return device.synceInterfaces.edges
          ?.map((i) => {
            const deviceInterface = i?.node;
            if (
              !deviceInterface ||
              !deviceInterface.synceLink ||
              !deviceInterface.synceLink.synceDevice ||
              !deviceInterface.synceDevice
            ) {
              return null;
            }

            return {
              id: `${deviceInterface.id}-${deviceInterface.synceLink.id}`,
              source: {
                interface: deviceInterface.id,
                nodeId: deviceInterface.synceDevice.name,
              },
              target: {
                interface: deviceInterface.synceLink.id,
                nodeId: deviceInterface.synceLink.synceDevice.name,
              },
            };
          })
          .filter(omitNullValue);
      })
      .filter(omitNullValue) ?? []
  );
}
