import {
  extendType,
  inputObjectType,
  nonNull,
  list,
  objectType,
  stringArg,
  enumType,
  interfaceType,
  queryField,
} from 'nexus';
import config from '../config';
import { fromGraphId, toGraphId } from '../helpers/id-helper';
import {
  getFilterQuery,
  getOldTopologyConnectedEdges,
  getOldTopologyDevices,
  getOldTopologyInterfaceEdges,
  makeInterfaceDeviceMap,
  makeInterfaceMap,
  makeInterfaceNameMap,
  makeNetTopologyEdges,
  makeNetTopologyNodes,
  makeNodesMap,
  makePtpTopologyEdges,
  makePtpTopologyNodes,
  makeTopologyEdges,
  makeTopologyNodes,
} from '../helpers/topology.helpers';
import { omitNullValue } from '../helpers/utils.helpers';

export const FilterTopologyInput = inputObjectType({
  name: 'FilterTopologyInput',
  definition: (t) => {
    t.list.nonNull.string('labels');
  },
});

export const GraphInterfaceStatus = enumType({
  name: 'GraphEdgeStatus',
  members: ['ok', 'unknown'],
});

export const GraphNodeInterface = objectType({
  name: 'GraphNodeInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.nonNull.string('name');
  },
});

export const GraphNodeCoordinates = objectType({
  name: 'GraphNodeCoordinates',
  definition: (t) => {
    t.nonNull.float('x');
    t.nonNull.float('y');
  },
});

export const BaseGraphNode = interfaceType({
  name: 'BaseGraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(GraphNodeInterface) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
    t.string('deviceType');
    t.string('softwareVersion');
  },
});

export const GraphNode = objectType({
  name: 'GraphNode',
  definition: (t) => {
    t.implements(BaseGraphNode);
    t.nonNull.field('device', { type: 'Device' });
  },
});

export const EdgeSourceTarget = objectType({
  name: 'EdgeSourceTarget',
  definition: (t) => {
    t.nonNull.string('nodeId');
    t.nonNull.string('interface');
  },
});

export const GraphEdge = objectType({
  name: 'GraphEdge',
  definition: (t) => {
    t.nonNull.id('id');
    t.int('weight');
    t.nonNull.field('source', { type: EdgeSourceTarget });
    t.nonNull.field('target', { type: EdgeSourceTarget });
  },
});

export const Topology = objectType({
  name: 'Topology',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(GraphNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphEdge) });
  },
});

const GraphVersionNode = objectType({
  name: 'GraphVersionNode',
  definition: (t) => {
    t.implements(BaseGraphNode);
    t.nonNull.field('name', { type: nonNull('String') });
  },
});

export const GraphVersionEdge = objectType({
  name: 'GraphVersionEdge',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.field('source', { type: EdgeSourceTarget });
    t.nonNull.field('target', { type: EdgeSourceTarget });
  },
});

export const TopologyVersionData = objectType({
  name: 'TopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(GraphVersionNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const TopologyCommonNodes = objectType({
  name: 'TopologyCommonNodes',
  definition: (t) => {
    t.nonNull.field('commonNodes', {
      type: list(nonNull('String')),
    });
  },
});

export const TopologyQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('topology', {
      type: Topology,
      args: {
        filter: FilterTopologyInput,
      },
      resolve: async (_, args, { prisma, tenantId, topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const { filter } = args;

        const topologyDevices = await topologyDiscoveryGraphQLAPI?.getTopologyDevices();
        // console.log(JSON.stringify(topologyDevices, null, 2));
        const labels = filter?.labels ?? [];
        const dbLabels = await prisma.label.findMany({ where: { name: { in: labels } } });
        const labelIds = dbLabels.map((l) => l.id);
        const filterQuery = getFilterQuery({ labelIds });
        const dbDevices = await prisma.device.findMany({ where: { tenantId, ...filterQuery } });

        return {
          nodes: makeTopologyNodes(dbDevices, topologyDevices),
          edges: makeTopologyEdges(topologyDevices),
        };
      },
    });
  },
});

export const PtpDiffSynceNode = objectType({
  name: 'PtpDiffSynceNode',
  definition: (t) => {
    t.nonNull.string('id');
  },
});

export const PtpDiffSynceEdges = objectType({
  name: 'PtpDiffSynceEdges',
  definition: (t) => {
    t.nonNull.field('node', { type: PtpDiffSynceNode });
  },
});

export const PtpDiffSynce = objectType({
  name: 'PtpDiffSynce',
  definition: (t) => {
    t.nonNull.list.nonNull.field('edges', { type: PtpDiffSynceEdges });
  },
});

export const PtpDiffSynceQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('ptpDiffSynce', {
      type: PtpDiffSynce,
      resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
        const data = await topologyDiscoveryGraphQLAPI?.getPtpDiffSynce();

        if (!data || !data.ptpDiffSynce.edges) {
          return { edges: [] };
        }

        const nodes = data.ptpDiffSynce.edges
          .map((e) => {
            const node = e?.node ? { node: { id: e.node.id } } : null;
            return node;
          })
          .filter(omitNullValue);

        return { edges: nodes };
      },
    });
  },
});

export const TopologyVersionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('topologyVersions', {
      type: list(nonNull('String')),
      resolve: async (_, _args, { topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const data = await topologyDiscoveryGraphQLAPI?.getBackups();
        return data?.backups ?? [];
      },
    });
  },
});

export const TopologyCommonNodesQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('topologyCommonNodes', {
      type: TopologyCommonNodes,
      args: {
        nodes: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled || !topologyDiscoveryGraphQLAPI) {
          return null;
        }
        const { nodes } = args;
        const commonNodes = await topologyDiscoveryGraphQLAPI.getCommonNodes(nodes);
        return {
          commonNodes,
        };
      },
    });
  },
});

export const TopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('topologyVersionData', {
      type: TopologyVersionData,
      args: {
        version: nonNull(stringArg()),
      },
      resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled || !topologyDiscoveryGraphQLAPI) {
          return {
            nodes: [],
            edges: [],
          };
        }

        const { nodes, edges } = await topologyDiscoveryGraphQLAPI.getLinksAndDevices();

        const { version } = args;
        const result = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version);
        const oldDevices = getOldTopologyDevices(nodes, result);

        // get interface edges for old version
        const { has: interfaceEdges, interfaces } = await topologyDiscoveryGraphQLAPI.getHasAndInterfaces();
        const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, result);
        const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
        const interfaceNameMap = makeInterfaceNameMap(
          [
            ...interfaces,
            ...result.deleted.PhyInterface,
            ...result.added.PhyInterface,
            ...result.changed.PhyInterface.map((i) => i.new),
            ...result.changed.PhyInterface.map((i) => i.old),
          ],
          (i) => i.name,
        );
        const interfaceMap = makeInterfaceMap(oldInterfaceEdges, interfaceNameMap);
        const nodesMap = makeNodesMap(oldDevices, (d) => d.name);

        const oldEdges = getOldTopologyConnectedEdges(edges, result)
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
            deviceType: device.details.device_type ?? null,
            softwareVersion: device.details.sw_version ?? null,
          })),
          edges: oldEdges,
        };
      },
    });
  },
});

export const GraphNodeCoordinatesInput = inputObjectType({
  name: 'GraphNodeCoordinatesInput',
  definition: (t) => {
    t.nonNull.string('deviceName');
    t.nonNull.float('x');
    t.nonNull.float('y');
  },
});

export const TopologyLayer = enumType({
  name: 'TopologyLayer',
  members: ['PhysicalTopology', 'PtpTopology'],
});

export const UpdateGraphNodeCooordinatesInput = inputObjectType({
  name: 'UpdateGraphNodeCoordinatesInput',
  definition: (t) => {
    t.nonNull.list.nonNull.field('coordinates', {
      type: GraphNodeCoordinatesInput,
    });
    t.field('layer', {
      type: TopologyLayer,
    });
  },
});

export const UpdateGraphNodeCoordinatesPayload = objectType({
  name: 'UpdateGraphNodeCoordinatesPayload',
  definition: (t) => {
    t.nonNull.list.nonNull.string('deviceNames');
  },
});

export const UpdateGraphNodeCoordinatesMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('updateGraphNodeCoordinates', {
      type: UpdateGraphNodeCoordinatesPayload,
      args: {
        input: nonNull(UpdateGraphNodeCooordinatesInput),
      },
      resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled || !topologyDiscoveryGraphQLAPI) {
          return { deviceNames: [] };
        }
        const { input } = args;
        const apiParams = input.coordinates.map((i) => ({ device: i.deviceName, x: i.x, y: i.y })) || [];
        const response = await topologyDiscoveryGraphQLAPI.updateCoordinates(
          apiParams,
          input.layer ?? 'PhysicalTopology',
        );
        return { deviceNames: response };
      },
    });
  },
});

export const NetInterface = objectType({
  name: 'NetInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.string('name');
  },
});

export const NetNetwork = objectType({
  name: 'NetNetwork',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.string('subnet');
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
  },
});

export const NetNode = objectType({
  name: 'NetNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('nodeId');
    t.nonNull.string('name');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(NetInterface) });
    t.nonNull.list.nonNull.field('networks', { type: nonNull(NetNetwork) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
  },
});

export const NetTopology = objectType({
  name: 'NetTopology',
  definition: (t) => {
    t.nonNull.list.field('edges', { type: nonNull(GraphEdge) });
    t.nonNull.list.field('nodes', { type: nonNull(NetNode) });
  },
});

export const NetTopologyQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('netTopology', {
      type: NetTopology,
      resolve: async (root, _, { topologyDiscoveryGraphQLAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }

        const netDevices = await topologyDiscoveryGraphQLAPI?.getNetTopologyDevices();

        return {
          nodes: makeNetTopologyNodes(netDevices),
          edges: makeNetTopologyEdges(netDevices),
        };
      },
    });
  },
});

export const NetRoutingPathNodeInfo = objectType({
  name: 'NetRoutingPathNodeInfo',
  definition: (t) => {
    t.int('weight');
    t.string('name');
  },
});

export const NetRoutingPathNode = objectType({
  name: 'NetRoutingPathNode',
  definition: (t) => {
    t.int('weight');
    t.field('nodes', { type: nonNull(list(nonNull(NetRoutingPathNodeInfo))) });
  },
});

export const ShortestPathQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('shortestPath', {
      type: nonNull(list(nonNull(NetRoutingPathNode))),
      args: {
        from: nonNull(stringArg()),
        to: nonNull(stringArg()),
      },
      resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
        const { from, to } = args;
        const fromNodeNativeId = fromGraphId('GraphNode', from);
        const toNodeNativeId = fromGraphId('GraphNode', to);

        const shortestPathResult = await topologyDiscoveryGraphQLAPI?.getShortestPath(fromNodeNativeId, toNodeNativeId);
        const shortestPathNodes = shortestPathResult?.netRoutingPaths?.edges?.filter(omitNullValue) ?? [];

        return shortestPathNodes.map((n) => ({
          weight: n.weight,
          nodes: n.nodes.map((nodes) => ({
            weight: nodes.weight,
            name: nodes.node,
          })),
        }));
      },
    });
  },
});

export const PtpPathToGrandMasterQuery = queryField('ptpPathToGrandMaster', {
  type: list(nonNull('String')),
  args: {
    deviceFrom: nonNull(stringArg()),
  },
  resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
    const { deviceFrom } = args;
    const fromNodeNativeId = fromGraphId('GraphNode', deviceFrom);

    const ptpPathResult = await topologyDiscoveryGraphQLAPI?.getPtpPathToGrandMaster(fromNodeNativeId);
    return ptpPathResult ?? [];
  },
});

export const PtpDeviceDetails = objectType({
  name: 'PtpDeviceDetails',
  definition: (t) => {
    t.nonNull.string('clockType');
    t.nonNull.int('domain');
    t.nonNull.string('ptpProfile');
    t.nonNull.string('clockId');
    t.nonNull.string('parentClockId');
    t.nonNull.string('gmClockId');
  },
});

export const PtpGraphNode = objectType({
  name: 'PtpGraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(GraphNodeInterface) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
    t.nonNull.string('nodeId');
    t.nonNull.string('name');
    t.nonNull.field('ptpDeviceDetails', { type: PtpDeviceDetails });
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.list.nonNull.string('labels');
  },
});

export const PtpTopology = objectType({
  name: 'PtpTopology',
  definition: (t) => {
    t.nonNull.list.field('edges', { type: nonNull(GraphEdge) });
    t.nonNull.list.field('nodes', { type: nonNull(PtpGraphNode) });
  },
});

export const PtpTopologyQuery = queryField('ptpTopology', {
  type: 'PtpTopology',
  resolve: async (_, _args, { topologyDiscoveryGraphQLAPI }) => {
    const ptpTopologyResult = await topologyDiscoveryGraphQLAPI?.getPtpTopology();

    const nodes = makePtpTopologyNodes(ptpTopologyResult);
    const edges = makePtpTopologyEdges(ptpTopologyResult);

    return {
      nodes,
      edges,
    };
  },
});
