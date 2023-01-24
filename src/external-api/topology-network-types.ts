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

const Node = t.type({
  _id: t.string,
  _key: t.string,
  // _rev: t.string,
  name: t.string,
});

const Device = t.intersection([Node, t.type({ labels: t.array(t.string) })]);

const Edge = t.type({
  _id: t.string,
  _key: t.string,
  _rev: t.string,
  _from: t.string,
  _to: t.string,
});

const Diff = t.type({
  phy_device: t.array(Device),
  phy_has: t.array(Edge),
  phy_interface: t.array(Node),
  phy_link: t.array(Edge),
});

const ChangedNode = t.type({
  new: Node,
  old: Node,
});

const ChangedDevice = t.type({
  new: Device,
  old: Device,
});

const ChangedEdge = t.type({
  new: Edge,
  old: Edge,
});

const ChangeDiff = t.type({
  phy_device: t.array(ChangedDevice),
  phy_has: t.array(ChangedEdge),
  phy_interface: t.array(ChangedNode),
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
