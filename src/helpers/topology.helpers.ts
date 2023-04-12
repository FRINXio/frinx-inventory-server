import {
  ArangoDevice,
  ArangoEdge,
  ArangoEdgeWithStatus,
  EdgeWithStatus,
  Status,
  TopologyDiffOutput,
} from '../external-api/topology-network-types';
import unwrap from './unwrap';

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
