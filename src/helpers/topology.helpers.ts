import { device as PrismaDevice } from '@prisma/client';
import { NetTopologyQuery, TopologyDevicesQuery } from '../__generated__/topology-discovery.graphql';
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

function getTopologyInterfaces(topologyDevices: TopologyDevicesQuery) {
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
            nodeId: node.name,
          };
        })
        .filter(omitNullValue);
      return nodeInterfaces || [];
    }) ?? []
  );
}

export function makeTopologyEdges(topologyDevices?: TopologyDevicesQuery) {
  if (!topologyDevices) {
    return [];
  }

  return getTopologyInterfaces(topologyDevices).map((i) => ({
    id: `${i.id}-${i.phyLink?.id}`,
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
