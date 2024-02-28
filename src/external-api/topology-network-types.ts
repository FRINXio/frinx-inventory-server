/* eslint-disable @typescript-eslint/naming-convention */
import { Either, fold } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

export function optional<T, U>(type: t.Type<T, U>) {
  return t.union([type, t.void]);
}

export function extractResult<A>(result: Either<t.Errors, A>): A {
  return fold(
    () => {
      const errorMessages = PathReporter.report(result);
      throw new Error(`BAD_REQUEST: ${errorMessages.join(',')}`);
    },
    (data: A) => data,
  )(result);
}

const VersionsOutputValidator = t.type({
  backups: t.array(t.string),
});

export type VersionsOutput = t.TypeOf<typeof VersionsOutputValidator>;

export function decodeVersionsOutput(value: unknown): VersionsOutput {
  return extractResult(VersionsOutputValidator.decode(value));
}

const Interface = t.type({
  _id: t.string,
  _key: t.string,
  name: t.string,
});
const NetInterface = t.type({
  _id: t.string,
  _key: t.string,
  ip_address: t.string,
});
const StatusValidator = t.union([t.literal('ok'), t.literal('unknown')]);
const InterfaceWithStatusValidator = t.intersection([
  Interface,
  t.type({
    status: StatusValidator,
  }),
]);
const CoordinatesValidator = t.type({
  x: t.number,
  y: t.number,
});
const DeviceValidator = t.intersection([
  InterfaceWithStatusValidator,
  t.type({
    labels: t.array(t.string),
    details: t.record(t.string, t.unknown),
    coordinates: CoordinatesValidator,
  }),
]);
const NetDeviceValidator = t.type({
  _id: t.string,
  _key: t.string,
  _rev: t.string,
  router_id: t.string,
  coordinates: CoordinatesValidator,
});

export type ArangoDevice = t.TypeOf<typeof DeviceValidator>;

export type Status = t.TypeOf<typeof StatusValidator>;

const Edge = t.type({
  _id: t.string,
  _key: t.string,
  _from: t.string,
  _to: t.string,
});
const EdgeWithStatusValidator = t.intersection([
  Edge,
  t.type({
    status: StatusValidator,
  }),
]);

export type EdgeWithStatus = t.TypeOf<typeof EdgeWithStatusValidator>;

export type ArangoEdge = t.TypeOf<typeof Edge>;
export type ArangoEdgeWithStatus = t.TypeOf<typeof EdgeWithStatusValidator>;

const ChangedDevice = t.type({
  new: DeviceValidator,
  old: DeviceValidator,
});

const ChangedEdge = t.type({
  new: Edge,
  old: Edge,
});
const ChangedInterface = t.type({
  new: InterfaceWithStatusValidator,
  old: InterfaceWithStatusValidator,
});
const ChangedEdgeWithStatusValidator = t.type({
  new: EdgeWithStatusValidator,
  old: EdgeWithStatusValidator,
});

const ChangePhyDiff = t.type({
  PhyDevice: t.array(ChangedDevice),
  PhyHas: t.array(ChangedEdgeWithStatusValidator),
  PhyInterface: t.array(ChangedInterface),
  PhyLink: t.array(ChangedEdge),
});

const PhyDiff = t.type({
  PhyDevice: t.array(DeviceValidator),
  PhyHas: t.array(EdgeWithStatusValidator),
  PhyInterface: t.array(InterfaceWithStatusValidator),
  PhyLink: t.array(Edge),
});

const ChangePtpDiff = t.type({
  PtpDevice: t.array(ChangedDevice),
  PtpHas: t.array(ChangedEdgeWithStatusValidator),
  PtpInterface: t.array(ChangedInterface),
  PtpLink: t.array(ChangedEdge),
});

const PtpDiff = t.type({
  PtpDevice: t.array(DeviceValidator),
  PtpHas: t.array(EdgeWithStatusValidator),
  PtpInterface: t.array(InterfaceWithStatusValidator),
  PtpLink: t.array(Edge),
});

const ChangeSynceDiff = t.type({
  SynceDevice: t.array(ChangedDevice),
  SynceHas: t.array(ChangedEdgeWithStatusValidator),
  SynceInterface: t.array(ChangedInterface),
  SynceLink: t.array(ChangedEdge),
});

const SynceDiff = t.type({
  SynceDevice: t.array(DeviceValidator),
  SynceHas: t.array(EdgeWithStatusValidator),
  SynceInterface: t.array(InterfaceWithStatusValidator),
  SynceLink: t.array(Edge),
});

const ChangeNetDiff = t.type({
  NetDevice: t.array(ChangedDevice),
  NetHas: t.array(ChangedEdgeWithStatusValidator),
  NetInterface: t.array(ChangedInterface),
  NetLink: t.array(ChangedEdge),
});

const NetDiff = t.type({
  NetDevice: t.array(DeviceValidator),
  NetHas: t.array(EdgeWithStatusValidator),
  NetInterface: t.array(InterfaceWithStatusValidator),
  NetLink: t.array(Edge),
});

const TopologyDiff = t.union([PhyDiff, PtpDiff, SynceDiff, NetDiff]);
const ChangeTopologyDiff = t.union([ChangePhyDiff, ChangePtpDiff, ChangeSynceDiff, ChangeNetDiff]);

export type PhyTopologyDiffType = {
  added: t.TypeOf<typeof PhyDiff>;
  changed: t.TypeOf<typeof ChangePhyDiff>;
  deleted: t.TypeOf<typeof PhyDiff>;
};

export type PtpTopologyDiffType = {
  added: t.TypeOf<typeof PtpDiff>;
  changed: t.TypeOf<typeof ChangePtpDiff>;
  deleted: t.TypeOf<typeof PtpDiff>;
};

export type SynceTopologyDiffType = {
  added: t.TypeOf<typeof SynceDiff>;
  changed: t.TypeOf<typeof ChangeSynceDiff>;
  deleted: t.TypeOf<typeof SynceDiff>;
};

export type NetTopologyDiffType = {
  added: t.TypeOf<typeof NetDiff>;
  changed: t.TypeOf<typeof ChangeNetDiff>;
  deleted: t.TypeOf<typeof NetDiff>;
};

const TopologyDiffOutputValidator = t.type({
  added: TopologyDiff,
  changed: ChangeTopologyDiff,
  deleted: TopologyDiff,
});

export type TopologyDiffOutput = t.TypeOf<typeof TopologyDiffOutputValidator>;

export function decodeTopologyDiffOutput(value: unknown): TopologyDiffOutput {
  return extractResult(TopologyDiffOutputValidator.decode(value));
}

const TopologyCommonNodesOutputValidator = t.type({
  'common-nodes': t.array(t.string),
});

export type TopologyCommonNodesOutput = t.TypeOf<typeof TopologyCommonNodesOutputValidator>;

export function decodeTopologyCommonNodesOutput(value: unknown): TopologyCommonNodesOutput {
  return extractResult(TopologyCommonNodesOutputValidator.decode(value));
}

const LinksAndDevicesOutputValidator = t.type({
  edges: t.array(Edge),
  nodes: t.array(DeviceValidator),
});

export type LinksAndDevicesOutput = t.TypeOf<typeof LinksAndDevicesOutputValidator>;

export function decodeLinksAndDevicesOutput(value: unknown): LinksAndDevicesOutput {
  return extractResult(LinksAndDevicesOutputValidator.decode(value));
}

export type InterfaceWithStatus = t.TypeOf<typeof InterfaceWithStatusValidator>;

const HasAndInterfacesOutputValidator = t.type({
  has: t.array(EdgeWithStatusValidator),
  interfaces: t.array(InterfaceWithStatusValidator),
});

export type HasAndInterfacesOutput = t.TypeOf<typeof HasAndInterfacesOutputValidator>;

export function decodeHasAndInterfacesOutput(value: unknown): HasAndInterfacesOutput {
  return extractResult(HasAndInterfacesOutputValidator.decode(value));
}

const UpdateCoordinatesOutputValidator = t.type({
  not_updated: t.array(t.string),
  updated: t.array(t.string),
});

export type UpdateCoordinatesOutput = t.TypeOf<typeof UpdateCoordinatesOutputValidator>;

export function decodeUpdateCoordinatesOutput(value: unknown): UpdateCoordinatesOutput {
  return extractResult(UpdateCoordinatesOutputValidator.decode(value));
}

const NetHasAndInterfacesOutputValidator = t.type({
  has: t.array(Edge),
  interfaces: t.array(NetInterface),
});

export type NetHasAndInterfacesOutput = t.TypeOf<typeof NetHasAndInterfacesOutputValidator>;

export function decodeNetHasAndInterfacesOutput(value: unknown): NetHasAndInterfacesOutput {
  return extractResult(NetHasAndInterfacesOutputValidator.decode(value));
}

const NetLinksAndDevicesOutputValidator = t.type({
  edges: t.array(Edge),
  nodes: t.array(NetDeviceValidator),
});

export type NetLinksAndDevicesOutput = t.TypeOf<typeof NetLinksAndDevicesOutputValidator>;

export function decodeNetLinksAndDevicesOutput(value: unknown): NetLinksAndDevicesOutput {
  return extractResult(NetLinksAndDevicesOutputValidator.decode(value));
}

const AdvertiseValidator = t.type({
  _from: t.string,
  _id: t.string,
  _to: t.string,
});
const NetworkValidator = t.type({
  _id: t.string,
  _key: t.string,
  coordinates: CoordinatesValidator,
  subnet: t.string,
});

export type NetNetwork = t.TypeOf<typeof NetworkValidator>;

const NetAdvertisesAndNetworksOutputValidator = t.type({
  advertises: t.array(AdvertiseValidator),
  networks: t.array(NetworkValidator),
});

export type NetAdvertisesAndNetworksOutput = t.TypeOf<typeof NetAdvertisesAndNetworksOutputValidator>;

export function decodeNetAdvertisesAndNetworks(value: unknown): NetAdvertisesAndNetworksOutput {
  return extractResult(NetAdvertisesAndNetworksOutputValidator.decode(value));
}
