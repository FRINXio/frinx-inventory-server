import { extendType, inputObjectType, nonNull, list, objectType, stringArg, enumType, arg, interfaceType } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { omitNullValue } from '../helpers/omit-null-value';
import {
  getFilterQuery,
  getOldTopologyConnectedEdges,
  getOldTopologyDevices,
  getOldTopologyInterfaceEdges,
  makeInterfaceDeviceMap,
  makeInterfaceMap,
  makeInterfaceNameMap,
  makeNetInterfaceMap,
  makeNodesMap,
} from '../helpers/topology.helpers';
import unwrap from '../helpers/unwrap';
import { NetNetwork as NetNetworkType } from '../external-api/topology-network-types';

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
      resolve: async (root, args, { prisma, tenantId, topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const { filter } = args;

        const { has: interfaceEdges, interfaces } = await topologyDiscoveryAPI.getHasAndInterfaces(
          unwrap(config.topologyDiscoveryURL),
        );
        const interfaceDeviceMap = makeInterfaceDeviceMap(interfaceEdges);
        const interfaceNameMap = makeInterfaceNameMap(interfaces, (i) => i.name);
        const interfaceMap = makeInterfaceMap(interfaceEdges, interfaceNameMap);
        const labels = filter?.labels ?? [];
        const dbLabels = await prisma.label.findMany({ where: { name: { in: labels } } });
        const labelIds = dbLabels.map((l) => l.id);
        const filterQuery = getFilterQuery({ labelIds });
        const dbDevices = await prisma.device.findMany({ where: { tenantId, ...filterQuery } });
        const linksAndDevices = await topologyDiscoveryAPI.getLinksAndDevices(unwrap(config.topologyDiscoveryURL));
        const { nodes, edges } = linksAndDevices;
        const nodesMap = makeNodesMap(nodes, (n) => n.name);
        return {
          nodes: dbDevices
            .map((device) => {
              const node = nodes.find((n) => n.name === device.name);
              if (node != null) {
                return {
                  id: toGraphId('GraphNode', node._key),
                  deviceType: node.details.device_type ?? null,
                  softwareVersion: node.details.sw_version ?? null,
                  device,
                  interfaces: interfaceMap[node._id] ?? [],
                  coordinates: node.coordinates,
                };
              }
              return null;
            })
            .filter(omitNullValue),
          edges: edges.map((e) => ({
            id: e._id,
            source: {
              interface: e._from,
              nodeId: nodesMap[interfaceDeviceMap[e._from]],
            },
            target: {
              interface: e._to,
              nodeId: nodesMap[interfaceDeviceMap[e._to]],
            },
          })),
        };
      },
    });
  },
});

export const TopologyVersionsQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('topologyVersions', {
      type: list(nonNull('String')),
      resolve: async (_, _args, { topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const { backups: versions } = await topologyDiscoveryAPI.getVersions(unwrap(config.topologyDiscoveryURL));
        return versions;
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
      resolve: async (_, args, { topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const { nodes } = args;
        const { 'common-nodes': commonNodes } = await topologyDiscoveryAPI.getCommonNodes(
          unwrap(config.topologyDiscoveryURL),
          nodes,
        );
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
      resolve: async (_, args, { topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return {
            nodes: [],
            edges: [],
          };
        }

        const { nodes, edges } = await topologyDiscoveryAPI.getLinksAndDevices(unwrap(config.topologyDiscoveryURL));

        const { version } = args;
        const result = await topologyDiscoveryAPI.getTopologyDiff(unwrap(config.topologyDiscoveryURL), version);
        const oldDevices = getOldTopologyDevices(nodes, result);

        // get interface edges for old version
        const { has: interfaceEdges, interfaces } = await topologyDiscoveryAPI.getHasAndInterfaces(
          unwrap(config.topologyDiscoveryURL),
        );
        const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, result);
        const interfaceDeviceMap = makeInterfaceDeviceMap(oldInterfaceEdges);
        const interfaceNameMap = makeInterfaceNameMap(
          [
            ...interfaces,
            ...result.deleted.phy_interface,
            ...result.added.phy_interface,
            ...result.changed.phy_interface.map((i) => i.new),
            ...result.changed.phy_interface.map((i) => i.old),
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
            id: toGraphId('GraphNode', device._key),
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
        input: nonNull(arg({ type: list(nonNull(GraphNodeCoordinatesInput)) })),
      },
      resolve: async (_, args, { topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return { deviceNames: [] };
        }
        const { input } = args;
        const apiParams = input.map((i) => ({ device: i.deviceName, x: i.x, y: i.y }));
        const response = await topologyDiscoveryAPI.updateCoordinates(unwrap(config.topologyDiscoveryURL), apiParams);
        return { deviceNames: response.updated };
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
      resolve: async (root, _, { topologyDiscoveryAPI }) => {
        if (!config.topologyEnabled) {
          return null;
        }
        const topologyDiscoveryURL = unwrap(config.topologyDiscoveryURL);

        const { has: interfaceEdges, interfaces } = await topologyDiscoveryAPI.getNetHasAndInterfaces(
          topologyDiscoveryURL,
        );
        const interfaceDeviceMap = makeInterfaceDeviceMap(interfaceEdges);
        const interfaceNameMap = makeInterfaceNameMap(interfaces, (i) => i.ip_address);
        const interfaceMap = makeNetInterfaceMap(interfaceEdges, interfaceNameMap);
        const linksAndDevices = await topologyDiscoveryAPI.getNetLinksAndDevices(topologyDiscoveryURL);
        const { nodes, edges } = linksAndDevices;
        const nodesMap = makeNodesMap(nodes, (n) => n.router_id);
        const { advertises, networks } = await topologyDiscoveryAPI.getNetAdvertisesAndNetworks(topologyDiscoveryURL);

        const networkMap: Record<string, NetNetworkType[]> = advertises.reduce((acc, curr) => {
          const network = unwrap(networks.find((n) => n._id === curr._to));
          return {
            ...acc,
            [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], network] : [network],
          };
        }, {} as Record<string, NetNetworkType[]>);

        return {
          nodes: nodes.map((n) => ({
            id: toGraphId('GraphNode', n._key),
            name: n.router_id,
            interfaces: interfaceMap[n._id] ?? [],
            coordinates: n.coordinates,
            networks: (networkMap[n._id] ?? []).map((ntw) => {
              const { _id, ...rest } = ntw;
              return {
                id: _id,
                ...rest,
              };
            }),
          })),
          edges: edges.map((e) => ({
            id: e._id,
            source: {
              interface: e._from,
              nodeId: nodesMap[interfaceDeviceMap[e._from]],
            },
            target: {
              interface: e._to,
              nodeId: nodesMap[interfaceDeviceMap[e._to]],
            },
          })),
        };
      },
    });
  },
});
