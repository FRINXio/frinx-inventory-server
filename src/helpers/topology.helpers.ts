import { device as PrismaDevice } from '@prisma/client';
import {
  DeviceMetadataQuery,
  NetTopologyQuery,
  PhyDevice,
  PtpDevice,
  PtpTopologyQuery,
  SynceDevice,
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
  PtpTopologyDiffType,
  SynceTopologyDiffType,
  NetTopologyDiffType,
  PhyTopologyDiffType,
  InterfaceWithStatus,
  PtpInterfaceWithStatus,
  SynceInterfaceWithStatus,
  ArangoNetDevice,
  NetInterface,
} from '../external-api/topology-network-types';
import { omitNullValue, unwrap } from './utils.helpers';
import { toGraphId } from './id-helper';
import { NexusGenObjects } from '../schema/nexus-typegen';
import { Location } from '../schema/source-types';

type FilterInput = {
  labelIds?: string[] | null;
};

type FilterQuery = {
  label?: Record<string, unknown>;
};

type PtpDeviceDetails = {
  clockType: string | null;
  domain: number | null;
  ptpProfile: string | null;
  clockId: string | null;
  parentClockId: string | null;
  gmClockId: string | null;
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

function isPtpTopologyDiff(topology: TopologyDiffOutput): topology is PtpTopologyDiffType {
  const added = Object.keys(topology.added).every((key) => key.includes('Ptp'));
  const deleted = Object.keys(topology.deleted).every((key) => key.includes('Ptp'));

  return added && deleted;
}

function isSynceTopologyDiff(topology: TopologyDiffOutput): topology is SynceTopologyDiffType {
  const added = Object.keys(topology.added).every((key) => key.includes('Synce'));
  const deleted = Object.keys(topology.deleted).every((key) => key.includes('Synce'));

  return added && deleted;
}

function isNetTopologyDiff(topology: TopologyDiffOutput): topology is NetTopologyDiffType {
  const added = Object.keys(topology.added).every((key) => key.includes('Net'));
  const deleted = Object.keys(topology.deleted).every((key) => key.includes('Net'));

  return added && deleted;
}

function isPhyTopologyDiff(topology: TopologyDiffOutput): topology is PhyTopologyDiffType {
  const added = Object.keys(topology.added).every((key) => key.includes('Phy'));
  const deleted = Object.keys(topology.deleted).every((key) => key.includes('Phy'));

  return added && deleted;
}

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

type QueryNetDevice = NonNullable<NonNullable<NonNullable<NetTopologyQuery['netDevices']['edges']>[0]>['node']>;
type PhyDeviceWithoutInterfaces = Omit<PhyDevice, 'phyInterfaces' | 'netDevice'>;
type PtpDeviceWithoutInterfaces = Omit<PtpDevice, 'ptpInterfaces' | 'netDevice'>;
type SynceDeviceWithoutInterfaces = Omit<SynceDevice, 'synceInterfaces' | 'netDevice'>;

export function convertNetDeviceToArangoDevice(netDevice: QueryNetDevice): ArangoNetDevice | null {
  if (!netDevice.phyDevice) {
    return null;
  }

  const { coordinates } = netDevice.phyDevice;

  return {
    _id: netDevice.id,
    _key: netDevice.id,
    _rev: netDevice.id,
    coordinates,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ospf_area_id: netDevice.ospfAreaId,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    router_id: netDevice.routerId,
    netNetworks:
      netDevice.netNetworks.edges
        ?.filter(omitNullValue)
        .map((n) => {
          if (!n?.node) {
            return null;
          }

          return {
            _id: n.node.id,
            _key: n.node.id,
            coordinates: n.node.coordinates,
            subnet: n.node.subnet,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ospf_route_type: n.node.ospfRouteType,
          };
        })
        .filter(omitNullValue) ?? [],
  };
}

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

export function getStatus(status: string | undefined): 'ok' | 'unknown' {
  return status === 'ok' ? 'ok' : 'unknown';
}

export function getPtpTopologyInterfaces(topologyDevices: PtpTopologyQuery) {
  return (
    topologyDevices.ptpDevices.edges?.flatMap((e) => {
      const node = e?.node;
      if (!node) {
        return [];
      }
      const nodeInterfaces = node.ptpInterfaces.edges
        ?.map((ie) => {
          const inode = ie?.node;
          if (!inode || !inode.ptpLinks.edges || inode.details == null) {
            return null;
          }
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.name,
            details: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ptp_status: inode.details.ptp_status,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              admin_oper_status: inode.details.admin_oper_status,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              ptsf_unusable: inode.details.ptsf_unusable,
            },
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
}

export function makePtpDeviceDetails(
  details: NonNullable<NonNullable<NonNullable<PtpTopologyQuery['ptpDevices']['edges']>[0]>['node']>['details'],
): PtpDeviceDetails {
  return {
    clockType: details.clock_type,
    domain: details.domain,
    ptpProfile: details.ptp_profile,
    clockId: details.clock_id,
    parentClockId: details.parent_clock_id,
    gmClockId: details.gm_clock_id,
    clockClass: details.clock_class,
    clockAccuracy: details.clock_accuracy,
    clockVariance: details.clock_variance,
    timeRecoveryStatus: details.time_recovery_status,
    globalPriority: details.global_priority,
    userPriority: details.user_priority,
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
          ptpDeviceDetails: makePtpDeviceDetails(node.details),
          status: getStatus(node.status),
          labels: node.labels?.map((l) => l) ?? [],
          interfaces:
            node.ptpInterfaces.edges
              ?.map((i) => {
                const interfaceNode = i?.node;
                if (!interfaceNode || interfaceNode.details == null) {
                  return null;
                }
                return {
                  id: interfaceNode.id,
                  name: interfaceNode.name,
                  status: getStatus(interfaceNode.status),
                  details: {
                    ptpStatus: interfaceNode.details.ptp_status,
                    adminOperStatus: interfaceNode.details.admin_oper_status,
                    ptsfUnusable: interfaceNode.details.ptsf_unusable,
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
  if (!ptpDevices) {
    return [];
  }

  return getPtpTopologyInterfaces(ptpDevices).flatMap((i) => {
    const links =
      i.ptpLinks.edges
        ?.map((ptpLinkEdge) => {
          if (!ptpLinkEdge?.link || !ptpLinkEdge?.node || !ptpLinkEdge.node.ptpDevice) {
            return null;
          }

          return {
            id: ptpLinkEdge.link,
            source: {
              interface: i.id,
              nodeId: i.nodeId,
            },
            target: {
              interface: ptpLinkEdge.node.id,
              nodeId: ptpLinkEdge.node.ptpDevice?.name,
            },
          };
        })
        .filter(omitNullValue) ?? [];

    return links;
  });
}

export type ArangoPtpDevice = Omit<ArangoDevice & { ptpDeviceDetails: PtpDeviceDetails }, 'details'>;

export function convertPtpDeviceToArangoDevice(ptpDevice: PtpDeviceWithoutInterfaces): ArangoPtpDevice {
  const { name, status, coordinates, details, labels } = ptpDevice;

  return {
    _id: ptpDevice.id,
    _key: ptpDevice.id,
    coordinates,
    ptpDeviceDetails: makePtpDeviceDetails(details),
    labels: labels ?? [],
    name,
    status,
  };
}

export type ArangoSynceDevice = Omit<ArangoDevice & { synceDeviceDetails: SynceDeviceDetails }, 'details'>;

export function convertSynceDeviceToArangoDevice(synceDevice: SynceDeviceWithoutInterfaces): ArangoSynceDevice {
  const { name, status, coordinates, details, labels } = synceDevice;
  return {
    _id: synceDevice.id,
    _key: synceDevice.id,
    coordinates,
    synceDeviceDetails: {
      selectedForUse: details.selected_for_use,
    },
    labels: labels ?? [],
    name,
    status,
  };
}

export function getNetNodesFromTopologyQuery(query: NetTopologyQuery): ArangoNetDevice[] {
  const nodes =
    query.netDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertNetDeviceToArangoDevice)
      .filter(omitNullValue) ?? [];

  return nodes;
}

export function getNodesFromTopologyQuery(query: TopologyDevicesQuery): ArangoDevice[] {
  const nodes =
    query.phyDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertPhyDeviceToArangoDevice) ?? [];
  return nodes;
}

export function getPtpNodesFromTopologyQuery(query: PtpTopologyQuery): ArangoPtpDevice[] {
  const nodes =
    query.ptpDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertPtpDeviceToArangoDevice) ?? [];
  return nodes;
}

export function getSynceNodesFromTopologyQuery(query: SynceTopologyQuery): ArangoSynceDevice[] {
  const nodes =
    query.synceDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertSynceDeviceToArangoDevice) ?? [];
  return nodes;
}

export function getEdgesFromTopologyQuery(query: TopologyDevicesQuery): ArangoEdge[] {
  const currentEdges = query.phyDevices.edges?.flatMap(
    (e) =>
      e?.node?.phyInterfaces.edges
        ?.map((i) => i?.node)
        .filter(omitNullValue)
        .flatMap((i) =>
          i.phyLinks.edges?.map((phyLinkEdge) => {
            if (!phyLinkEdge?.link || !phyLinkEdge?.node) {
              return null;
            }
            return {
              _id: phyLinkEdge.link,
              _key: phyLinkEdge.link,
              _from: i.id,
              _to: phyLinkEdge.node.id,
            };
          }),
        )
        .filter(omitNullValue) ?? [],
  );
  return currentEdges ?? [];
}

export function getPtpEdgesFromTopologyQuery(query: PtpTopologyQuery): ArangoEdge[] {
  const currentEdges = query.ptpDevices.edges?.flatMap(
    (e) =>
      e?.node?.ptpInterfaces.edges
        ?.map((i) => i?.node)
        .filter(omitNullValue)
        .flatMap((i) =>
          i.ptpLinks.edges?.map((ptpLinkEdge) => {
            if (!ptpLinkEdge?.link || !ptpLinkEdge?.node) {
              return null;
            }
            return {
              _id: ptpLinkEdge.link,
              _key: ptpLinkEdge.link,
              _from: i.id,
              _to: ptpLinkEdge.node.id,
            };
          }),
        )
        .filter(omitNullValue) ?? [],
  );
  return currentEdges ?? [];
}

export function getSynceEdgesFromTopologyQuery(query: SynceTopologyQuery): ArangoEdge[] {
  const currentEdges = query.synceDevices.edges?.flatMap(
    (e) =>
      e?.node?.synceInterfaces.edges
        ?.map((i) => i?.node)
        .filter(omitNullValue)
        .flatMap((i) =>
          i.synceLinks?.edges?.map((synceLinkEdge) => {
            if (!synceLinkEdge?.link || !synceLinkEdge?.node) {
              return null;
            }
            return {
              _id: synceLinkEdge.link,
              _key: synceLinkEdge.link,
              _from: i.id,
              _to: synceLinkEdge.node.id,
            };
          }),
        )
        .filter(omitNullValue) ?? [],
  );

  return currentEdges ?? [];
}

export function getNetEdgesFromTopologyQuery(query: NetTopologyQuery): ArangoEdge[] {
  const currentEdges = query.netDevices.edges?.flatMap(
    (e) =>
      e?.node?.netInterfaces.edges
        ?.map((i) => i?.node)
        .filter(omitNullValue)
        .flatMap((i) =>
          i.netLinks?.edges?.map((netLinkEdge) => {
            if (!netLinkEdge?.link || !netLinkEdge?.node) {
              return null;
            }
            return {
              _id: netLinkEdge.link,
              _key: netLinkEdge.link,
              _from: i.id,
              _to: netLinkEdge.node.id,
            };
          }),
        )
        .filter(omitNullValue) ?? [],
  );

  return currentEdges ?? [];
}

export function getOldTopologyInterfaceEdges(
  interfaceEdges: ArangoEdgeWithStatus[],
  diffData: TopologyDiffOutput,
): ArangoEdgeWithStatus[] {
  if (isPhyTopologyDiff(diffData)) {
    return (
      interfaceEdges
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
        })
    );
  }

  if (isPtpTopologyDiff(diffData)) {
    return (
      interfaceEdges
        // filter has edges added to current topology
        .filter((e) => !diffData.added.PtpHas.find((h) => e._id === h._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.PtpInterface.find((i) => e._to === i._id))
        // filter edges pointing to added device
        .filter((e) => !diffData.added.PtpDevice.find((d) => e._from === d._id))
        // add has edges removed from current topology
        .concat(diffData.deleted.PtpHas)
        // change `PtpHas` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.PtpHas.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  if (isSynceTopologyDiff(diffData)) {
    return (
      interfaceEdges
        // filter has edges added to current topology
        .filter((e) => !diffData.added.SynceHas.find((h) => e._id === h._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.SynceInterface.find((i) => e._to === i._id))
        // filter edges pointing to added device
        .filter((e) => !diffData.added.SynceDevice.find((d) => e._from === d._id))
        // add has edges removed from current topology
        .concat(diffData.deleted.SynceHas)
        // change `SynceHas` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.SynceHas.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  return [];
}

export function getOldNetTopologyInterfaceEdges(
  interfaceEdges: ArangoEdge[],
  diffData: TopologyDiffOutput,
): ArangoEdge[] {
  if (isNetTopologyDiff(diffData)) {
    return (
      interfaceEdges
        // filter has edges added to current topology
        .filter((e) => !diffData.added.NetHas.find((h) => e._id === h._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.NetInterface.find((i) => e._to === i._id))
        // filter edges pointing to added device
        .filter((e) => !diffData.added.NetDevice.find((d) => e._from === d._id))
        // add has edges removed from current topology
        .concat(diffData.deleted.NetHas)
        // change `NetHas` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.NetHas.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  return [];
}

export function getOldTopologyConnectedEdges(connected: ArangoEdge[], diffData: TopologyDiffOutput): ArangoEdge[] {
  if (isPhyTopologyDiff(diffData)) {
    return (
      connected
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
        })
    );
  }

  if (isPtpTopologyDiff(diffData)) {
    return (
      connected
        // filter connected edges added to current topology
        .filter((e) => !diffData.added.PtpLink.find((c) => e._id === c._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.PtpInterface.find((i) => e._to === i._id))
        // add connected edges removed from current topology
        .concat(diffData.deleted.PtpLink)
        // change `PtpLink` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.PtpLink.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  if (isSynceTopologyDiff(diffData)) {
    return (
      connected
        // filter connected edges added to current topology
        .filter((e) => !diffData.added.SynceLink.find((c) => e._id === c._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.SynceInterface.find((i) => e._to === i._id))
        // add connected edges removed from current topology
        .concat(diffData.deleted.SynceLink)
        // change `SynceLink` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.SynceLink.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  if (isNetTopologyDiff(diffData)) {
    return (
      connected
        // filter connected edges added to current topology
        .filter((e) => !diffData.added.NetLink.find((c) => e._id === c._id))
        // filter edges pointing to added interfaces
        .filter((e) => !diffData.added.NetInterface.find((i) => e._to === i._id))
        // add connected edges removed from current topology
        .concat(diffData.deleted.NetLink)
        // change `NetLink` edges from old topology
        .map((e) => {
          const changedEdge = diffData.changed.NetLink.find((h) => h.old._id === e._id);
          if (!changedEdge) {
            return e;
          }
          return changedEdge.old;
        })
    );
  }

  return [];
}

export function getOldTopologyDevices(devices: ArangoDevice[], diffData: TopologyDiffOutput): ArangoDevice[] {
  let oldDevices: ArangoDevice[] = [];

  if (isPhyTopologyDiff(diffData)) {
    oldDevices = devices
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
  }

  return oldDevices;
}

export function getOldPtpTopologyDevices(devices: ArangoPtpDevice[], diffData: TopologyDiffOutput): ArangoPtpDevice[] {
  let oldDevices: ArangoPtpDevice[] = [];

  if (isPtpTopologyDiff(diffData)) {
    const parsedOldDevices = diffData.deleted.PtpDevice.map((d) => ({
      ...d,
      ptpDeviceDetails: makePtpDeviceDetails(d.details),
    }));

    oldDevices = devices
      // filter devices added to current topology
      .filter(
        (n) =>
          !diffData.added.PtpDevice.map((d) => ({
            ...d,
            ptpDeviceDetails: makePtpDeviceDetails(d.details),
          })).find((d) => n._id === d._id),
      )
      // add devices removed from current topology
      .concat(parsedOldDevices)
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.PtpDevice.map((d) => ({
          old: {
            ...d.old,
            ptpDeviceDetails: makePtpDeviceDetails(d.old.details),
          },
          new: {
            ...d.new,
            ptpDeviceDetails: makePtpDeviceDetails(d.new.details),
          },
        })).find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return n;
        }
        return changedDevice.old;
      });
  }

  return oldDevices;
}

export function getOldSynceDevicesTopology(
  devices: ArangoSynceDevice[],
  diffData: TopologyDiffOutput,
): ArangoSynceDevice[] {
  let oldDevices: ArangoSynceDevice[] = [];

  if (isSynceTopologyDiff(diffData)) {
    oldDevices = devices
      .map((d) => ({
        ...d,
        synceDeviceDetails: {
          selectedForUse: d.synceDeviceDetails.selectedForUse,
        },
      }))
      // filter devices added to current topology
      .filter((n) => !diffData.added.SynceDevice.find((d) => n._id === d._id))
      // add devices removed from current topology
      .concat(
        diffData.deleted.SynceDevice.map((d) => ({
          ...d,
          synceDeviceDetails: {
            selectedForUse: d.details.selected_for_use,
          },
        })),
      )
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.SynceDevice.find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return { ...n, synceDeviceDetails: { selectedForUse: n.synceDeviceDetails.selectedForUse } };
        }
        return {
          ...changedDevice.old,
          synceDeviceDetails: { selectedForUse: changedDevice.old.details.selected_for_use },
        };
      });
  }

  return oldDevices;
}

export function getOldNetDevicesTopology(devices: ArangoNetDevice[], diffData: TopologyDiffOutput): ArangoNetDevice[] {
  let oldDevices: ArangoNetDevice[] = [];

  const deviceNetworkTuple = new Map(devices.map((d) => [d._id, d.netNetworks.map((n) => n._id)]));

  if (isNetTopologyDiff(diffData)) {
    oldDevices = devices
      // filter devices added to current topology
      .filter((n) => !diffData.added.NetDevice.find((d) => n._id === d._id))
      // add devices removed from current topology
      .concat(
        diffData.deleted.NetDevice.map((d) => ({
          ...d,
          netNetworks: diffData.deleted.NetNetwork.filter((n) => deviceNetworkTuple.get(d._id)?.includes(n._id)),
        })),
      )
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.NetDevice.find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return {
            ...n,
          };
        }
        return {
          ...changedDevice.old,
          netNetworks: diffData.changed.NetNetwork.filter((network) =>
            deviceNetworkTuple.get(changedDevice.old._id)?.includes(network.old._id),
          ).map((network) => network.old),
        };
      });
  }

  return oldDevices;
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

export function getTopologyDiffInterfaces(diffData: TopologyDiffOutput): InterfaceWithStatus[] {
  if (isPhyTopologyDiff(diffData)) {
    return [
      ...diffData.added.PhyInterface,
      ...diffData.deleted.PhyInterface,
      ...diffData.changed.PhyInterface.map((i) => i.old),
      ...diffData.changed.PhyInterface.map((i) => i.new),
    ];
  }

  if (isPtpTopologyDiff(diffData)) {
    return [
      ...diffData.added.PtpInterface,
      ...diffData.deleted.PtpInterface,
      ...diffData.changed.PtpInterface.map((i) => i.old),
      ...diffData.changed.PtpInterface.map((i) => i.new),
    ];
  }

  if (isSynceTopologyDiff(diffData)) {
    return [
      ...diffData.added.SynceInterface,
      ...diffData.deleted.SynceInterface,
      ...diffData.changed.SynceInterface.map((i) => i.old),
      ...diffData.changed.SynceInterface.map((i) => i.new),
    ];
  }

  return [];
}

export function getTopologyDiffNetInterfaces(diffData: TopologyDiffOutput): NetInterface[] {
  if (isNetTopologyDiff(diffData)) {
    return [
      ...diffData.added.NetInterface,
      ...diffData.deleted.NetInterface,
      ...diffData.changed.NetInterface.map((i) => i.old),
      ...diffData.changed.NetInterface.map((i) => i.new),
    ];
  }

  return [];
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

export type PtpInterfaceMap = Record<string, { id: string; status: Status; name: string }[]>;

export function makePtpInterfaceMap(
  edges: EdgeWithStatus[],
  interfaceNameMap: Record<string, string>,
): PtpInterfaceMap {
  return edges.reduce((acc, curr) => {
    const item = { id: curr._to, status: curr.status, name: interfaceNameMap[curr._to] };
    return {
      ...acc,
      [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], item] : [item],
    };
  }, {} as InterfaceMap);
}

export type SynceInterfaceMap = Record<string, { id: string; status: Status; name: string }[]>;

export function makeSynceInterfaceMap(
  edges: EdgeWithStatus[],
  interfaceNameMap: Record<string, string>,
): SynceInterfaceMap {
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

export function makeTopologyNodes(dbDevices: PrismaDevice[], topologyDevices?: TopologyDevicesQuery) {
  if (!topologyDevices) {
    return [];
  }

  // hashmap used to map topology device with device inventory id via its name
  const dbDevicesMap = new Map(dbDevices.map((d) => [d.name, d]));

  const nodes =
    topologyDevices.phyDevices.edges
      ?.map((edge) => {
        if (!edge || !edge.node) {
          return null;
        }
        const { node } = edge;

        return {
          id: toGraphId('GraphNode', node.id),
          name: node.name,
          deviceType: node.details.device_type ?? null,
          softwareVersion: node.details.sw_version ?? null,
          device: dbDevicesMap.get(node.name) ?? null,
          interfaces:
            node.phyInterfaces.edges?.map((e) => ({
              id: unwrap(e?.node?.id),
              status: getStatus(e?.node?.status),
              name: unwrap(e?.node?.name),
            })) ?? [],
          coordinates: node.coordinates,
        };
      })
      .filter(omitNullValue) ?? [];
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
          if (!inode || !inode.phyLinks) {
            return null;
          }
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.name,
            details: node.details,
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
}

export function getSynceTopologyInterfaces(topologyDevices: SynceTopologyQuery) {
  return (
    topologyDevices.synceDevices.edges?.flatMap((e) => {
      const node = e?.node;
      if (!node) {
        return [];
      }
      const nodeInterfaces = node.synceInterfaces.edges
        ?.map((ie) => {
          const inode = ie?.node;
          if (!inode || !inode.synceLinks) {
            return null;
          }
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.name,
            details: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              synce_enabled: inode?.details?.synce_enabled ?? null,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              rx_quality_level: inode?.details?.rx_quality_level ?? null,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              qualified_for_use: inode?.details?.qualified_for_use ?? null,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              not_selected_due_to: inode?.details?.not_selected_due_to ?? null,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              not_qualified_due_to: inode?.details?.not_qualified_due_to ?? null,
            },
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
}

export function getNetTopologyInterfaces(topologyDevices: NetTopologyQuery) {
  return (
    topologyDevices.netDevices.edges?.flatMap((e) => {
      const node = e?.node;
      if (!node) {
        return [];
      }
      const nodeInterfaces = node.netInterfaces.edges
        ?.map((ie) => {
          const inode = ie?.node;
          if (!inode || !inode.netLinks) {
            return null;
          }
          if (!node.phyDevice) {
            return null;
          }
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.routerId,
            name: node.routerId,
            status: node.phyDevice.status,
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
          // _key: i?.node?.phyLink?.id ?? '', // INFO: idHas was removed
          _key: 'some_id',
          _from: d.node?.id ?? '',
          _to: i?.node?.id ?? '',
          status: d.node?.status ?? 'unknown',
        })) ?? [],
    ) ?? []
  );
}

export function getPtpDeviceInterfaceEdges(topologyDevices: PtpTopologyQuery): ArangoEdgeWithStatus[] {
  return (
    topologyDevices.ptpDevices.edges?.flatMap(
      (d) =>
        d?.node?.ptpInterfaces.edges?.map((i) => ({
          _id: `${d.node?.id}-${i?.node?.id}`,
          // _key: i?.node?.phyLink?.id ?? '', // INFO: idHas was removed
          _key: 'some_id',
          _from: d.node?.id ?? '',
          _to: i?.node?.id ?? '',
          status: d.node?.status ?? 'unknown',
        })) ?? [],
    ) ?? []
  );
}

export function getSynceDeviceInterfaceEdges(topologyDevices: SynceTopologyQuery): ArangoEdgeWithStatus[] {
  return (
    topologyDevices.synceDevices.edges?.flatMap(
      (d) =>
        d?.node?.synceInterfaces.edges?.map((i) => ({
          _id: `${d.node?.id}-${i?.node?.id}`,
          // _key: i?.node?.phyLink?.id ?? '', // INFO: idHas was removed
          _key: 'some_id',
          _from: d.node?.id ?? '',
          _to: i?.node?.id ?? '',
          status: d.node?.status ?? 'unknown',
        })) ?? [],
    ) ?? []
  );
}

export function getNetDeviceInterfaceEdges(topologyDevices: NetTopologyQuery): ArangoEdgeWithStatus[] {
  return (
    topologyDevices.netDevices.edges?.flatMap(
      (d) =>
        d?.node?.netInterfaces.edges
          ?.map((i) => {
            // Check if node.phyDevice exists
            if (d.node?.phyDevice) {
              return {
                _id: `${d.node.id}-${i?.node?.id}`,
                // _key: i?.node?.phyLink?.id ?? '', // INFO: idHas was removed
                _key: 'some_id',
                _from: d.node.id,
                _to: i?.node?.id ?? '',
                status: d.node.phyDevice.status ?? 'unknown',
              };
            }
            return null;
          })
          .filter(omitNullValue) ?? [],
    ) ?? []
  );
}

export function makeTopologyEdges(topologyDevices?: TopologyDevicesQuery): NexusGenObjects['GraphVersionEdge'][] {
  if (!topologyDevices) {
    return [];
  }

  return getTopologyInterfaces(topologyDevices).flatMap((i) => {
    const links =
      i.phyLinks.edges
        ?.map((phyLinkEdge) => {
          if (!phyLinkEdge?.link || !phyLinkEdge?.node || !phyLinkEdge.node.phyDevice) {
            return null;
          }

          return {
            id: phyLinkEdge.link,
            source: {
              interface: i.id,
              nodeId: i.nodeId,
            },
            target: {
              interface: phyLinkEdge.node.id,
              nodeId: phyLinkEdge.node.phyDevice?.name,
            },
          };
        })
        .filter(omitNullValue) ?? [];

    return links;
  });
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
          ?.flatMap((i) => {
            const deviceInterface = i?.node;
            if (!deviceInterface || !deviceInterface.netLinks) {
              return null;
            }

            return deviceInterface.netLinks.edges?.map((ne) => {
              if (!ne?.node) {
                return null;
              }

              const { node: netLinkNode } = ne;

              if (!netLinkNode.netDevice) {
                return null;
              }

              if (!deviceInterface.netDevice) {
                return null;
              }

              if (!ne.link) {
                return null;
              }

              return {
                id: ne.link,
                weight: netLinkNode.igp_metric ?? null,
                source: {
                  interface: deviceInterface.id,
                  nodeId: deviceInterface.netDevice.routerId,
                },
                target: {
                  interface: netLinkNode.id,
                  nodeId: netLinkNode.netDevice.routerId,
                },
              };
            });
          })
          .filter(omitNullValue);
      })
      .filter(omitNullValue) ?? []
  );
}

export function makeNetTopologyEdges(netTopologyDevices?: NetTopologyQuery) {
  return netTopologyDevices ? getEdgesFromTopologyDevices(netTopologyDevices.netDevices.edges) : [];
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
                  details: {
                    synceEnabled: interfaceNode.details?.synce_enabled,
                    rxQualityLevel: interfaceNode.details?.rx_quality_level,
                    qualifiedForUse: interfaceNode.details?.qualified_for_use,
                    notSelectedDueTo: interfaceNode.details?.not_selected_due_to,
                    notQualifiedDueTo: interfaceNode.details?.not_qualified_due_to,
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

export function makeSynceTopologyEdges(synceDevices?: SynceTopologyQuery) {
  if (!synceDevices) {
    return [];
  }

  return getSynceTopologyInterfaces(synceDevices).flatMap((i) => {
    const links =
      i.synceLinks?.edges
        ?.map((synceLinkEdge) => {
          if (!synceLinkEdge?.link || !synceLinkEdge?.node || !synceLinkEdge.node.synceDevice) {
            return null;
          }

          return {
            id: synceLinkEdge.link,
            source: {
              interface: i.id,
              nodeId: i.nodeId,
            },
            target: {
              interface: synceLinkEdge.node.id,
              nodeId: synceLinkEdge.node.synceDevice?.name,
            },
          };
        })
        .filter(omitNullValue) ?? [];

    return links;
  });
}

export function makeTopologyDiff(
  topologyDiff: TopologyDiffOutput,
  currentNodes: ArangoDevice[],
  currentEdges: ArangoEdge[],
  interfaces: InterfaceWithStatus[],
  interfaceEdges: ArangoEdgeWithStatus[],
) {
  const oldDevices = getOldTopologyDevices(currentNodes, topologyDiff);
  const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, topologyDiff);

  const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
  const interfaceNameMap = makeInterfaceNameMap(
    [...interfaces, ...getTopologyDiffInterfaces(topologyDiff)],
    (i) => i.name,
  );
  const interfaceMap = makeInterfaceMap(oldInterfaceEdges, interfaceNameMap);
  const nodesMap = makeNodesMap(oldDevices, (d) => d.name);

  const oldEdges = getOldTopologyConnectedEdges(currentEdges, topologyDiff)
    .map((e) => ({
      id: e._id,
      source: {
        interface: e._from,
        nodeId: nodesMap[interfaceDeviceMap[e._from]],
      },
      target: {
        interface: e._to,
        nodeId: nodesMap[interfaceDeviceMap[e._to]],
      },
    }))
    .filter((e) => e.source.nodeId != null && e.target.nodeId != null);

  return {
    nodes: oldDevices.map((device) => ({
      id: toGraphId('GraphNode', device._id),
      name: device.name,
      interfaces: interfaceMap[device._id] ?? [],
      coordinates: device.coordinates,
      details: device.details,
      deviceType: device.details.device_type ? String(device.details.device_type) : null,
      softwareVersion: device.details.sw_version ? String(device.details.sw_version) : null,
    })),
    edges: oldEdges,
  };
}

export function makePtpTopologyDiff(
  topologyDiff: TopologyDiffOutput,
  currentNodes: ArangoPtpDevice[],
  currentEdges: ArangoEdge[],
  interfaces: PtpInterfaceWithStatus[],
  interfaceEdges: ArangoEdgeWithStatus[],
) {
  const oldDevices = getOldPtpTopologyDevices(currentNodes, topologyDiff);
  const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, topologyDiff);

  const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
  const interfaceNameMap = makeInterfaceNameMap(
    [...interfaces, ...getTopologyDiffInterfaces(topologyDiff)],
    (i) => i.name,
  );

  const interfaceMap = makeInterfaceMap(oldInterfaceEdges, interfaceNameMap);
  const nodesMap = makeNodesMap(oldDevices, (d) => d.name);

  const oldEdges = getOldTopologyConnectedEdges(currentEdges, topologyDiff)
    .map((e) => ({
      id: e._id,
      source: {
        interface: e._from,
        nodeId: nodesMap[interfaceDeviceMap[e._from]],
      },
      target: {
        interface: e._to,
        nodeId: nodesMap[interfaceDeviceMap[e._to]],
      },
    }))
    .filter((e) => e.source.nodeId != null && e.target.nodeId != null);

  return {
    nodes: oldDevices.map((device) => ({
      id: toGraphId('GraphNode', device._id),
      name: device.name,
      nodeId: device._id,
      status: device.status,
      interfaces:
        interfaceMap[device._id].map((intf) => {
          const details = interfaces.find((i) => i.name === intf.name)?.details;
          return {
            ...intf,
            details: {
              ptpStatus: details?.ptp_status ?? '',
              ptsfUnusable: details?.ptsf_unusable ?? '',
              adminOperStatus: details?.admin_oper_status ?? '',
            },
          };
        }) ?? [],
      coordinates: device.coordinates,
      ptpDeviceDetails: device.ptpDeviceDetails,
    })),
    edges: oldEdges,
  };
}

export function makeSynceTopologyDiff(
  topologyDiff: TopologyDiffOutput,
  currentNodes: ArangoSynceDevice[],
  currentEdges: ArangoEdge[],
  interfaces: SynceInterfaceWithStatus[],
  interfaceEdges: ArangoEdgeWithStatus[],
) {
  const oldDevices = getOldSynceDevicesTopology(currentNodes, topologyDiff);
  const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, topologyDiff);

  const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
  const interfaceNameMap = makeInterfaceNameMap(
    [...interfaces, ...getTopologyDiffInterfaces(topologyDiff)],
    (i) => i.name,
  );
  const interfaceMap = makeInterfaceMap(oldInterfaceEdges, interfaceNameMap);
  const nodesMap = makeNodesMap(oldDevices, (d) => d.name);

  const oldEdges = getOldTopologyConnectedEdges(currentEdges, topologyDiff)
    .map((e) => ({
      id: e._id,
      source: {
        interface: e._from,
        nodeId: nodesMap[interfaceDeviceMap[e._from]],
      },
      target: {
        interface: e._to,
        nodeId: nodesMap[interfaceDeviceMap[e._to]],
      },
    }))
    .filter((e) => e.source.nodeId != null && e.target.nodeId != null);

  return {
    nodes: oldDevices.map((device) => ({
      id: toGraphId('GraphNode', device._id),
      name: device.name,
      interfaces:
        interfaceMap[device._id].map((intf) => {
          const details = interfaces.find((i) => i.name === intf.name)?.details;

          return {
            ...intf,
            details: {
              synceEnabled: details?.synce_enabled,
              rxQualityLevel: details?.rx_quality_level,
              qualifiedForUse: details?.qualified_for_use,
              notSelectedDueTo: details?.not_selected_due_to,
              notQualifiedDueTo: details?.not_qualified_due_to,
            },
          };
        }) ?? [],
      coordinates: device.coordinates,
      synceDeviceDetails: device.synceDeviceDetails,
      nodeId: device._id,
      status: device.status,
    })),
    edges: oldEdges,
  };
}

export function makeNetTopologyDiff(
  topologyDiff: TopologyDiffOutput,
  currentNodes: ArangoNetDevice[],
  currentEdges: ArangoEdge[],
  interfaces: NetInterface[],
  interfaceEdges: ArangoEdgeWithStatus[],
) {
  const oldDevices = getOldNetDevicesTopology(currentNodes, topologyDiff);
  const oldInterfaceEdges = getOldNetTopologyInterfaceEdges(interfaceEdges, topologyDiff);

  const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
  const interfaceNameMap = makeInterfaceNameMap(
    [...interfaces, ...getTopologyDiffNetInterfaces(topologyDiff)],
    (i) => i.ip_address,
  );
  const interfaceMap = makeNetInterfaceMap(oldInterfaceEdges, interfaceNameMap);
  const nodesMap = makeNodesMap(oldDevices, (d) => d.router_id);

  const oldEdges = getOldTopologyConnectedEdges(currentEdges, topologyDiff)
    .map((e) => ({
      id: e._id,
      source: {
        interface: e._from,
        nodeId: nodesMap[interfaceDeviceMap[e._from]],
      },
      target: {
        interface: e._to,
        nodeId: nodesMap[interfaceDeviceMap[e._to]],
      },
    }))
    .filter((e) => e.source.nodeId != null && e.target.nodeId != null);

  return {
    nodes: oldDevices.map((device) => ({
      id: toGraphId('GraphNode', device._id),
      nodeId: device._id,
      name: device.router_id,
      networks: device.netNetworks.map((n) => ({ ...n, id: n._id })),
      interfaces:
        interfaceMap[device._id]?.map((intf) => ({
          ...intf,
        })) ?? [],
      coordinates: device.coordinates,
    })),
    edges: oldEdges,
  };
}

export function convertDeviceMetadataToMapNodes(
  deviceMetadataQuery: DeviceMetadataQuery,
  deviceLocationMap: Map<string, Location | null>,
) {
  if (deviceMetadataQuery.deviceMetadata?.edges == null) {
    return null;
  }

  const mapNodes = deviceMetadataQuery.deviceMetadata.edges
    .filter(omitNullValue)
    .map((e) => {
      const { node } = e;
      if (node == null) {
        return null;
      }

      const { id, deviceName, geoLocation: topologyGeolocation } = node;
      const geolocation = topologyGeolocation
        ? {
            latitude: topologyGeolocation.coordinates[0],
            longitude: topologyGeolocation.coordinates[1],
          }
        : null;

      const deviceLocation = deviceLocationMap.get(node.deviceName)?.name ?? null;

      return {
        id: toGraphId('MapNode', id),
        deviceName,
        locationName: deviceLocation,
        geolocation,
      };
    })
    .filter(omitNullValue);

  return mapNodes;
}
