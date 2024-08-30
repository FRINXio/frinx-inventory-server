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
import { fromGraphId } from '../helpers/id-helper';
import {
  convertDeviceMetadataToMapNodes,
  getDeviceInterfaceEdges,
  getEdgesFromTopologyQuery,
  getFilterQuery,
  getMplsDeviceInterfaceEdges,
  getMplsEdgesFromTopologyQuery,
  getMplsNodesFromTopologyQuery,
  getMplsTopologyInterfaces,
  getNetDeviceInterfaceEdges,
  getNetEdgesFromTopologyQuery,
  getNetNodesFromTopologyQuery,
  getNetTopologyInterfaces,
  getNodesFromTopologyQuery,
  getPtpDeviceInterfaceEdges,
  getPtpEdgesFromTopologyQuery,
  getPtpNodesFromTopologyQuery,
  getPtpTopologyInterfaces,
  getStatus,
  getSynceDeviceInterfaceEdges,
  getSynceEdgesFromTopologyQuery,
  getSynceNodesFromTopologyQuery,
  getSynceTopologyInterfaces,
  getTopologyInterfaces,
  makeMplsTopologyDiff,
  makeMplsTopologyEdges,
  makeMplsTopologyNodes,
  makeNetTopologyDiff,
  makeNetTopologyEdges,
  makeNetTopologyNodes,
  makePtpTopologyDiff,
  makePtpTopologyEdges,
  makePtpTopologyNodes,
  makeSynceTopologyDiff,
  makeSynceTopologyEdges,
  makeSynceTopologyNodes,
  makeTopologyDiff,
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
  members: ['OK', 'UNKNOWN'],
});

export const PtpGraphNodeInterfaceDetails = objectType({
  name: 'PtpGraphNodeInterfaceDetails',
  definition: (t) => {
    t.nonNull.string('ptpStatus');
    t.nonNull.string('adminOperStatus');
    t.nonNull.string('ptsfUnusable');
  },
});

export const GraphNodeInterface = objectType({
  name: 'GraphNodeInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.nonNull.string('name');
  },
});

export const PtpGraphNodeInterface = objectType({
  name: 'PtpGraphNodeInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.nonNull.string('name');
    t.field('details', { type: PtpGraphNodeInterfaceDetails });
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
    t.nonNull.string('name');
    t.field('device', { type: 'Device' });
  },
});

export const Geolocation = objectType({
  name: 'Geolocation',
  definition: (t) => {
    t.nonNull.float('latitude');
    t.nonNull.float('longitude');
  },
});

export const GeoMapDevice = objectType({
  name: 'GeoMapDevice',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('deviceName');
    t.string('locationName');
    t.field('geolocation', { type: Geolocation });
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

export const PtpDeviceDetails = objectType({
  name: 'PtpDeviceDetails',
  definition: (t) => {
    t.string('clockType');
    t.int('domain');
    t.string('ptpProfile');
    t.string('clockId');
    t.string('parentClockId');
    t.string('gmClockId');
    t.int('clockClass');
    t.string('clockAccuracy');
    t.string('clockVariance');
    t.string('timeRecoveryStatus');
    t.int('globalPriority');
    t.int('userPriority');
  },
});

export const PtpGraphNode = objectType({
  name: 'PtpGraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(PtpGraphNodeInterface) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
    t.nonNull.string('nodeId');
    t.nonNull.string('name');
    t.nonNull.field('ptpDeviceDetails', { type: PtpDeviceDetails });
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.list.nonNull.string('labels');
  },
});

export const SynceDeviceDetails = objectType({
  name: 'SynceDeviceDetails',
  definition: (t) => {
    t.string('selectedForUse');
  },
});

export const SynceGraphNodeInterfaceDetails = objectType({
  name: 'SynceGraphNodeInterfaceDetails',
  definition: (t) => {
    t.boolean('synceEnabled');
    t.string('rxQualityLevel');
    t.string('qualifiedForUse');
    t.string('notQualifiedDueTo');
    t.string('notSelectedDueTo');
  },
});

export const SynceGraphNodeInterface = objectType({
  name: 'SynceGraphNodeInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.nonNull.string('name');
    t.field('details', { type: SynceGraphNodeInterfaceDetails });
  },
});

export const SynceGraphNode = objectType({
  name: 'SynceGraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('nodeId');
    t.nonNull.string('name');
    t.nonNull.field('synceDeviceDetails', { type: SynceDeviceDetails });
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.list.nonNull.string('labels');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(SynceGraphNodeInterface) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
  },
});

export const MplsData = objectType({
  name: 'MplsData',
  definition: (t) => {
    t.nonNull.string('lspId');
    t.int('inputLabel');
    t.string('inputInterface');
    t.int('outputLabel');
    t.string('outputInterface');
    t.string('operState');
    t.string('ldpPrefix');
    t.string('mplsOperation');
  },
});

export const Signalization = enumType({
  name: 'Signalization',
  members: ['RSVP', 'LDP'],
});

export const LspTunnel = objectType({
  name: 'LspTunnel',
  definition: (t) => {
    t.nonNull.string('lspId');
    t.string('fromDevice');
    t.string('toDevice');
    t.int('uptime');
    t.field('signalization', { type: Signalization });
  },
});

export const MplsDeviceDetails = objectType({
  name: 'MplsDeviceDetails',
  definition: (t) => {
    t.list.field('mplsData', { type: MplsData });
    t.list.field('lspTunnels', { type: LspTunnel });
  },
});

export const MplsGraphNodeInterface = objectType({
  name: 'MplsGraphNodeInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.nonNull.string('name');
  },
});

export const MplsGraphNode = objectType({
  name: 'MplsGraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('nodeId');
    t.nonNull.string('name');
    t.nonNull.field('mplsDeviceDetails', { type: MplsDeviceDetails });
    t.nonNull.field('status', { type: GraphInterfaceStatus });
    t.list.nonNull.string('labels');
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(MplsGraphNodeInterface) });
    t.nonNull.field('coordinates', { type: GraphNodeCoordinates });
  },
});

export const PhyTopologyVersionData = objectType({
  name: 'PhyTopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(GraphVersionNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const PtpTopologyVersionData = objectType({
  name: 'PtpTopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(PtpGraphNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const SynceTopologyVersionData = objectType({
  name: 'SynceTopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(SynceGraphNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const MplsTopologyVersionData = objectType({
  name: 'MplsTopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(MplsGraphNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const NetInterface = objectType({
  name: 'NetInterface',
  definition: (t) => {
    t.nonNull.string('id');
    t.nonNull.string('name');
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

export const PhyTopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('phyTopologyVersionData', {
      type: PhyTopologyVersionData,
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

        const topologyDevicesResult = await topologyDiscoveryGraphQLAPI.getTopologyDevices();

        const currentNodes = getNodesFromTopologyQuery(topologyDevicesResult);
        const currentEdges = getEdgesFromTopologyQuery(topologyDevicesResult);

        const interfaces = getTopologyInterfaces(topologyDevicesResult).map((i) => ({
          ...i,
          _key: i.id,
          status: getStatus(i.status),
        }));
        const interfaceEdges = getDeviceInterfaceEdges(topologyDevicesResult);

        const { version } = args;
        const topologyDiff = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version, 'PHYSICAL_TOPOLOGY');

        return makeTopologyDiff(topologyDiff, currentNodes, currentEdges, interfaces, interfaceEdges);
      },
    });
  },
});

export const PtpTopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('ptpTopologyVersionData', {
      type: PtpTopologyVersionData,
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

        const topologyDevicesResult = await topologyDiscoveryGraphQLAPI.getPtpTopology();

        const currentNodes = getPtpNodesFromTopologyQuery(topologyDevicesResult);
        const currentEdges = getPtpEdgesFromTopologyQuery(topologyDevicesResult);

        const interfaces = getPtpTopologyInterfaces(topologyDevicesResult).map((i) => ({ ...i, _key: i.id }));
        const interfaceEdges = getPtpDeviceInterfaceEdges(topologyDevicesResult);

        const { version } = args;
        const topologyDiff = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version, 'PTP_TOPOLOGY');

        return makePtpTopologyDiff(topologyDiff, currentNodes, currentEdges, interfaces, interfaceEdges);
      },
    });
  },
});

export const TopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('synceTopologyVersionData', {
      type: SynceTopologyVersionData,
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

        const topologyDevicesResult = await topologyDiscoveryGraphQLAPI.getSynceTopology();

        const currentNodes = getSynceNodesFromTopologyQuery(topologyDevicesResult);
        const currentEdges = getSynceEdgesFromTopologyQuery(topologyDevicesResult);

        const interfaces = getSynceTopologyInterfaces(topologyDevicesResult).map((i) => ({ ...i, _key: i.id }));
        const interfaceEdges = getSynceDeviceInterfaceEdges(topologyDevicesResult);

        const { version } = args;
        const topologyDiff = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version, 'ETH_TOPOLOGY');

        return makeSynceTopologyDiff(topologyDiff, currentNodes, currentEdges, interfaces, interfaceEdges);
      },
    });
  },
});

export const MplsTopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('mplsTopologyVersionData', {
      type: MplsTopologyVersionData,
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

        const topologyDevicesResult = await topologyDiscoveryGraphQLAPI.getMplsTopology();

        const currentNodes = getMplsNodesFromTopologyQuery(topologyDevicesResult);
        const currentEdges = getMplsEdgesFromTopologyQuery(topologyDevicesResult);

        const interfaces = getMplsTopologyInterfaces(topologyDevicesResult).map((i) => ({ ...i, _key: i.id }));
        const interfaceEdges = getMplsDeviceInterfaceEdges(topologyDevicesResult);

        const { version } = args;
        const topologyDiff = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version, 'MPLS_TOPOLOGY');

        return makeMplsTopologyDiff(topologyDiff, currentNodes, currentEdges, interfaces, interfaceEdges);
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
  members: ['PHYSICAL_TOPOLOGY', 'PTP_TOPOLOGY', 'ETH_TOPOLOGY', 'MPLS_TOPOLOGY'],
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
          input.layer ?? 'PHYSICAL_TOPOLOGY',
        );
        return {
          deviceNames: response,
        };
      },
    });
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
    t.string('phyDeviceName');
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

export const NetTopologyVersionData = objectType({
  name: 'NetTopologyVersionData',
  definition: (t) => {
    t.nonNull.list.field('nodes', { type: nonNull(NetNode) });
    t.nonNull.list.field('edges', { type: nonNull(GraphVersionEdge) });
  },
});

export const NetTopologyVersionDataQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('netTopologyVersionData', {
      type: NetTopologyVersionData,
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

        const topologyDevicesResult = await topologyDiscoveryGraphQLAPI.getNetTopologyDevices();

        const currentNodes = getNetNodesFromTopologyQuery(topologyDevicesResult);
        const currentEdges = getNetEdgesFromTopologyQuery(topologyDevicesResult);

        const interfaces = getNetTopologyInterfaces(topologyDevicesResult).map((i) => ({
          ...i,
          _key: i.id,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          ip_address: i.ipAddress,
        }));
        const interfaceEdges = getNetDeviceInterfaceEdges(topologyDevicesResult);

        const { version } = args;
        const topologyDiff = await topologyDiscoveryGraphQLAPI.getTopologyDiff(version, 'NETWORK_TOPOLOGY');

        return makeNetTopologyDiff(topologyDiff, currentNodes, currentEdges, interfaces, interfaceEdges);
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

export const SynceTopology = objectType({
  name: 'SynceTopology',
  definition: (t) => {
    t.nonNull.list.field('edges', { type: nonNull(GraphEdge) });
    t.nonNull.list.field('nodes', { type: nonNull(SynceGraphNode) });
  },
});

export const SynceTopologyQuery = queryField('synceTopology', {
  type: 'SynceTopology',
  resolve: async (_, _args, { topologyDiscoveryGraphQLAPI }) => {
    const synceTopologyResult = await topologyDiscoveryGraphQLAPI?.getSynceTopology();

    const nodes = makeSynceTopologyNodes(synceTopologyResult);
    const edges = makeSynceTopologyEdges(synceTopologyResult);

    return {
      nodes,
      edges,
    };
  },
});

export const SyncePathToGrandMasterQuery = queryField('syncePathToGrandMaster', {
  type: list(nonNull('String')),
  args: {
    deviceFrom: nonNull(stringArg()),
  },
  resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
    const { deviceFrom } = args;
    const fromNodeNativeId = fromGraphId('GraphNode', deviceFrom);

    const syncePathResult = await topologyDiscoveryGraphQLAPI?.getSyncePathToGrandMaster(fromNodeNativeId);
    return syncePathResult ?? [];
  },
});

export const DeviceMetadata = objectType({
  name: 'DeviceMetadata',
  definition: (t) => {
    t.list.field('nodes', {
      type: GeoMapDevice,
    });
  },
});

export const TopologyType = enumType({
  name: 'TopologyType',
  members: ['PHYSICAL_TOPOLOGY', 'PTP_TOPOLOGY', 'ETH_TOPOLOGY', 'NETWORK_TOPOLOGY', 'MPLS_TOPOLOGY'],
});

export const PolygonInputType = inputObjectType({
  name: 'PolygonInput',
  definition(t) {
    t.list.nonNull.list.nonNull.list.nonNull.float('polygon');
  },
});

export const FilterDevicesMetadatasInput = inputObjectType({
  name: 'FilterDevicesMetadatasInput',
  definition: (t) => {
    t.string('deviceName');
    t.field('topologyType', { type: TopologyType });
    t.field('polygon', { type: PolygonInputType });
  },
});

export const deviceMetadataQuery = queryField('deviceMetadata', {
  type: DeviceMetadata,
  args: {
    filter: FilterDevicesMetadatasInput,
  },
  resolve: async (_, args, { prisma, topologyDiscoveryGraphQLAPI }) => {
    if (!topologyDiscoveryGraphQLAPI) {
      return null;
    }

    const deviceMetadataResult = await topologyDiscoveryGraphQLAPI.getDeviceMetadata({
      deviceName: args.filter?.deviceName,
      topologyType: args.filter?.topologyType,
      polygon: args.filter?.polygon?.polygon,
    });

    const dbDevices = await prisma.device.findMany({
      include: {
        location: true,
      },
    });

    const deviceLocationMap = new Map(dbDevices.map((d) => [d.name, d.location]));

    const mapNodes = convertDeviceMetadataToMapNodes(deviceMetadataResult, deviceLocationMap);
    return mapNodes
      ? {
          nodes: mapNodes,
        }
      : null;
  },
});

export const MplsTopology = objectType({
  name: 'MplsTopology',
  definition: (t) => {
    t.nonNull.list.field('edges', { type: nonNull(GraphEdge) });
    t.nonNull.list.field('nodes', { type: nonNull(MplsGraphNode) });
  },
});

export const MplsTopologyQuery = queryField('mplsTopology', {
  type: 'MplsTopology',
  resolve: async (_, _args, { topologyDiscoveryGraphQLAPI }) => {
    const mplsTopologyResult = await topologyDiscoveryGraphQLAPI?.getMplsTopology();

    const nodes = makeMplsTopologyNodes(mplsTopologyResult);
    const edges = makeMplsTopologyEdges(mplsTopologyResult);

    return {
      nodes,
      edges,
    };
  },
});

export const MplsLspCountItem = objectType({
  name: 'MplsLspCountItem',
  definition: (t) => {
    t.string('target');
    t.int('incomingLsps');
    t.int('outcomingLsps');
  },
});

export const MplsTotalLspCount = objectType({
  name: 'MplsLspCount',
  definition: (t) => {
    t.list.field('counts', { type: MplsLspCountItem });
  },
});

export const MplsLspCountQuery = queryField('mplsLspCount', {
  type: 'MplsLspCount',
  args: {
    deviceId: nonNull(stringArg()),
  },
  resolve: async (_, args, { topologyDiscoveryGraphQLAPI }) => {
    const { deviceId } = args;
    const nativeId = fromGraphId('GraphNode', deviceId);
    const result = await topologyDiscoveryGraphQLAPI?.getMplsLspCount(nativeId);

    if (!result?.mplsLspCount) {
      return null;
    }

    return {
      counts: result.mplsLspCount.map((c) => ({
        target: c?.toDevice ?? null,
        incomingLsps: c?.incomingLsps ?? null,
        outcomingLsps: c?.outcomingLsps ?? null,
      })),
    };
  },
});
