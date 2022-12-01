import { ArangoDevice, ArangoEdge } from '../arango-client';
import { TopologyDiffOutput } from '../external-api/topology-network-types';

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
  const oldDevices: ArangoDevice[] = devices
    // remove devices added to current topology
    .filter((n) => diffData.added.Device.find((d) => n._id !== d._id))
    // add devices removed from current topology
    .concat(diffData.deleted.Device)
    // change devices from old topology
    .map((n) => {
      const changedDevice = diffData.changed.Device.find((d) => d.old._id === n._id);
      if (!changedDevice) {
        return n;
      }
      return changedDevice.old;
    });
  return oldDevices;
}

export function getOldTopologyInterfaceEdges(interfaceEdges: ArangoEdge[], diffData: TopologyDiffOutput): ArangoEdge[] {
  const oldInterfaceEdges: ArangoEdge[] = interfaceEdges
    // remove has edges added to current topology
    .filter((e) => diffData.added.Has.find((h) => e._id !== h._id))
    // add has edges removed from current topology
    .concat(diffData.deleted.Has)
    // change has edges from old topology
    .map((e) => {
      const changedEdge = diffData.changed.Has.find((h) => h.old._id === e._id);
      if (!changedEdge) {
        return e;
      }
      return changedEdge.old;
    })
    // remove edges pointing to added interfaces or added device
    .filter(
      (e) =>
        diffData.added.Interface.find((i) => e._to !== i._id) && diffData.added.Device.find((d) => e._from !== d._id),
    );
  return oldInterfaceEdges;
}
