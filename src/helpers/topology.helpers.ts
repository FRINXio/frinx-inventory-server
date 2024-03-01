import { device as PrismaDevice } from '@prisma/client';
import {
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
} from '../external-api/topology-network-types';
import { omitNullValue, unwrap } from './utils.helpers';
import { toGraphId } from './id-helper';
import { NexusGenObjects } from '../schema/nexus-typegen';

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

type PhyDeviceWithoutInterfaces = Omit<PhyDevice, 'phyInterfaces' | 'netDevice'>;
type PtpDeviceWithoutInterfaces = Omit<PtpDevice, 'ptpInterfaces' | 'netDevice'>;
type SynceDeviceWithoutInterfaces = Omit<SynceDevice, 'synceInterfaces' | 'netDevice'>;

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

export function convertPtpDeviceToArangoDevice(ptpDevice: PtpDeviceWithoutInterfaces): ArangoDevice {
  const { name, status, coordinates, details, labels } = ptpDevice;
  return {
    _id: ptpDevice.id,
    _key: ptpDevice.id,
    coordinates,
    details,
    labels: labels ?? [],
    name,
    status,
  };
}

export function convertSynceDeviceToArangoDevice(synceDevice: SynceDeviceWithoutInterfaces): ArangoDevice {
  const { name, status, coordinates, details, labels } = synceDevice;
  return {
    _id: synceDevice.id,
    _key: synceDevice.id,
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

export function getPtpNodesFromTopologyQuery(query: PtpTopologyQuery): ArangoDevice[] {
  const nodes =
    query.ptpDevices.edges
      ?.map((e) => e?.node)
      .filter(omitNullValue)
      .map(convertPtpDeviceToArangoDevice) ?? [];
  return nodes;
}

export function getSynceNodesFromTopologyQuery(query: SynceTopologyQuery): ArangoDevice[] {
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

  if (isPtpTopologyDiff(diffData)) {
    oldDevices = devices
      // filter devices added to current topology
      .filter((n) => !diffData.added.PtpDevice.find((d) => n._id === d._id))
      // add devices removed from current topology
      .concat(diffData.deleted.PtpDevice)
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.PtpDevice.find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return n;
        }
        return changedDevice.old;
      });
  }

  if (isSynceTopologyDiff(diffData)) {
    oldDevices = devices
      // filter devices added to current topology
      .filter((n) => !diffData.added.SynceDevice.find((d) => n._id === d._id))
      // add devices removed from current topology
      .concat(diffData.deleted.SynceDevice)
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.SynceDevice.find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return n;
        }
        return changedDevice.old;
      });
  }

  if (isNetTopologyDiff(diffData)) {
    oldDevices = devices
      // filter devices added to current topology
      .filter((n) => !diffData.added.NetDevice.find((d) => n._id === d._id))
      // add devices removed from current topology
      .concat(diffData.deleted.NetDevice)
      // change devices from old topology
      .map((n) => {
        const changedDevice = diffData.changed.NetDevice.find((d) => d.old._id === n._id);
        if (!changedDevice) {
          return n;
        }
        return changedDevice.old;
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

export function getStatus(status: string | undefined): 'ok' | 'unknown' {
  return status === 'ok' ? 'ok' : 'unknown';
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
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
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
          if (!inode || !inode.ptpLinks.edges) {
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
          return {
            ...inode,
            _id: inode.id,
            nodeId: node.routerId,
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

              return {
                id: `${netLinkNode.id}-${netLinkNode.id}`,
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
  const edges =
    ptpDevices?.ptpDevices.edges
      ?.flatMap((e) => {
        const device = e?.node ?? null;
        if (!device) {
          return [];
        }

        return device.ptpInterfaces.edges?.flatMap((i) => {
          const ptpInterface = i?.node;
          if (!ptpInterface || !ptpInterface.ptpLinks) {
            return null;
          }

          return ptpInterface.ptpLinks.edges?.map((pe) => {
            if (!pe?.node) {
              return null;
            }

            const { node: ptpLinkNode } = pe;
            if (!ptpLinkNode.ptpDevice) {
              return null;
            }

            return {
              id: `${ptpInterface.id}-${ptpLinkNode.id}`,
              source: {
                interface: ptpInterface.id,
                nodeId: device.name,
              },
              target: {
                interface: ptpLinkNode.id,
                nodeId: ptpLinkNode.ptpDevice.name,
              },
            };
          });
        });
      })
      .filter(omitNullValue) ?? [];

  return edges;
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
  return (
    synceDevices?.synceDevices.edges
      ?.flatMap((e) => {
        const device = e?.node ?? null;
        if (!device) {
          return [];
        }

        return device.synceInterfaces.edges
          ?.flatMap((i) => {
            const deviceInterface = i?.node;
            if (!device || !deviceInterface?.synceLinks) {
              return null;
            }

            return deviceInterface.synceLinks.edges?.map((se) => {
              if (!se?.node) {
                return null;
              }

              const { node: synceLinkNode } = se;
              if (!synceLinkNode.synceDevice) {
                return null;
              }

              return {
                id: `${deviceInterface.id}-${synceLinkNode.id}`,
                source: {
                  interface: deviceInterface.id,
                  nodeId: device.name,
                },
                target: {
                  interface: synceLinkNode.id,
                  nodeId: synceLinkNode.synceDevice.name,
                },
              };
            });
          })
          .filter(omitNullValue);
      })
      .filter(omitNullValue) ?? []
  );
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
      deviceType: String(device.details.device_type) ?? null,
      softwareVersion: String(device.details.sw_version) ?? null,
    })),
    edges: oldEdges,
  };
}
