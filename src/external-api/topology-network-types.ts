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
  // _rev: t.string,
  name: t.string,
});

const Device = t.intersection([
  Interface,
  t.type({
    labels: t.array(t.string),
    details: t.type({
      device_type: optional(t.string),
      sw_version: optional(t.string),
    }),
    coordinates: t.type({
      x: t.number,
      y: t.number,
    }),
  }),
]);

export type ArangoDevice = t.TypeOf<typeof Device>;

const EdgeStatus = t.union([t.literal('ok'), t.literal('unknown')]);
const Edge = t.type({
  _id: t.string,
  _key: t.string,
  _rev: t.string,
  _from: t.string,
  _to: t.string,
});
const EdgeWithStatus = t.intersection([
  Edge,
  t.type({
    status: EdgeStatus,
  }),
]);

export type ArangoEdge = t.TypeOf<typeof Edge>;
export type ArangoEdgeWithStatus = t.TypeOf<typeof EdgeWithStatus>;

const Diff = t.type({
  phy_device: t.array(Device),
  phy_has: t.array(EdgeWithStatus),
  phy_interface: t.array(Interface),
  phy_link: t.array(Edge),
});

// const ChangedNode = t.type({
//   new: Node,
//   old: Node,
// });

const ChangedDevice = t.type({
  new: Device,
  old: Device,
});

const ChangedEdge = t.type({
  new: Edge,
  old: Edge,
});

const ChangedEdgeWithStatus = t.type({
  new: EdgeWithStatus,
  old: EdgeWithStatus,
});

const ChangeDiff = t.type({
  phy_device: t.array(ChangedDevice),
  phy_has: t.array(ChangedEdgeWithStatus),
  phy_interface: t.array(ChangedDevice),
  phy_link: t.array(ChangedEdge),
});

const TopologyDiffOutputValidator = t.type({
  added: Diff,
  changed: ChangeDiff,
  deleted: Diff,
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
  nodes: t.array(Device),
});

export type LinksAndDevicesOutput = t.TypeOf<typeof LinksAndDevicesOutputValidator>;

export function decodeLinksAndDevicesOutput(value: unknown): LinksAndDevicesOutput {
  return extractResult(LinksAndDevicesOutputValidator.decode(value));
}

const HasOutputValidator = t.array(EdgeWithStatus);

export type HasOutput = t.TypeOf<typeof HasOutputValidator>;

export function decodeHasOutput(value: unknown): HasOutput {
  return extractResult(HasOutputValidator.decode(value));
}

const UpdateCoordinatesOutputValidator = t.type({
  not_updated_devices: t.array(t.string),
  updated_devices: t.array(t.string),
});

export type UpdateCoordinatesOutput = t.TypeOf<typeof UpdateCoordinatesOutputValidator>;

export function decodeUpdateCoordinatesOutput(value: unknown): UpdateCoordinatesOutput {
  return extractResult(UpdateCoordinatesOutputValidator.decode(value));
}
