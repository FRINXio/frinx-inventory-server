import {
  ArangoDevice,
  ArangoEdge,
  ArangoEdgeWithStatus,
  EdgeWithStatus,
  InterfaceWithStatus,
  Status,
  TopologyDiffOutput,
} from '../external-api/topology-network-types';
import { unwrap } from './utils.helpers';

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
    .filter((n) => !diffData.added.phy_device.find((d) => n._id === d._id))
    // add devices removed from current topology
    .concat(diffData.deleted.phy_device)
    // change devices from old topology
    .map((n) => {
      const changedDevice = diffData.changed.phy_device.find((d) => d.old._id === n._id);
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
    .filter((e) => !diffData.added.phy_has.find((h) => e._id === h._id))
    // filter edges pointing to added interfaces
    .filter((e) => !diffData.added.phy_interface.find((i) => e._to === i._id))
    // filter edges pointing to added device
    .filter((e) => !diffData.added.phy_device.find((d) => e._from === d._id))
    // add has edges removed from current topology
    .concat(diffData.deleted.phy_has)
    // change `phy_has` edges from old topology
    .map((e) => {
      const changedEdge = diffData.changed.phy_has.find((h) => h.old._id === e._id);
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
    .filter((e) => !diffData.added.phy_link.find((c) => e._id === c._id))
    // filter edges pointing to added interfaces
    .filter((e) => !diffData.added.phy_interface.find((i) => e._to === i._id))
    // add connected edges removed from current topology
    .concat(diffData.deleted.phy_link)
    // change `phy_link` edges from old topology
    .map((e) => {
      const changedEdge = diffData.changed.phy_link.find((h) => h.old._id === e._id);
      if (!changedEdge) {
        return e;
      }
      return changedEdge.old;
    });
  return oldConnected;
}

export function makeInterfaceDeviceMap(edges: EdgeWithStatus[]): Record<string, string> {
  return edges.reduce((acc, curr, _, arr) => {
    const device = unwrap(arr.find((intfc) => intfc._to === curr._to)?._from);
    return {
      ...acc,
      [curr._to]: device,
    };
  }, {});
}

export function makeInterfaceNameMap(interfaces: InterfaceWithStatus[]): Record<string, string> {
  return interfaces.reduce(
    (acc, curr) => ({
      ...acc,
      [curr._id]: curr.name,
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

export function makeNodesMap(nodes: ArangoDevice[]): Record<string, string> {
  return nodes.reduce(
    (acc, curr) => ({
      ...acc,
      [curr._id]: curr.name,
    }),
    {} as Record<string, string>,
  );
}
