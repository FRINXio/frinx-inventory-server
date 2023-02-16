import { extendType, inputObjectType, nonNull, list, objectType, stringArg, enumType } from 'nexus';
import config from '../config';
import { toGraphId } from '../helpers/id-helper';
import { omitNullValue } from '../helpers/omit-null-value';
import {
  getFilterQuery,
  getOldTopologyConnectedEdges,
  getOldTopologyDevices,
  getOldTopologyInterfaceEdges,
} from '../helpers/topology-helpers';
import unwrap from '../helpers/unwrap';

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
  },
});

export const GraphNode = objectType({
  name: 'GraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.field('device', { type: 'Device' });
    t.nonNull.list.nonNull.field('interfaces', { type: nonNull(GraphNodeInterface) });
    t.string('deviceType');
    t.string('softwareVersion');
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
    t.nonNull.id('id');
    t.nonNull.field('name', { type: nonNull('String') });
    t.nonNull.list.nonNull.string('interfaces');
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

        const interfaceEdges = await topologyDiscoveryAPI.getHas(unwrap(config.topologyDiscoveryURL));
        const interfaceDeviceMap = interfaceEdges.reduce<Record<string, string>>((acc, curr, i, arr) => {
          const dvc = unwrap(arr.find((int) => int._to === curr._to)?._from);
          return {
            ...acc,
            [curr._to]: dvc,
          };
        }, {} as Record<string, string>);
        const interfaceMap = interfaceEdges.reduce<Record<string, { id: string; status: 'ok' | 'unknown' }[]>>(
          (acc, curr) => ({
            ...acc,
            [curr._from]: acc[curr._from]?.length
              ? [...acc[curr._from], { id: curr._to, status: curr.status }]
              : [{ id: curr._to, status: curr.status }],
          }),
          {} as Record<string, { id: string; status: 'ok' | 'unknown' }[]>,
        );
        const labels = filter?.labels ?? [];
        const dbLabels = await prisma.label.findMany({ where: { name: { in: labels } } });
        const labelIds = dbLabels.map((l) => l.id);
        const filterQuery = getFilterQuery({ labelIds });
        const dbDevices = await prisma.device.findMany({ where: { tenantId, ...filterQuery } });
        const linksAndDevices = await topologyDiscoveryAPI.getLinksAndDevices(unwrap(config.topologyDiscoveryURL));
        const { nodes, edges } = linksAndDevices;
        const nodesMap = nodes.reduce(
          (acc, curr) => ({
            ...acc,
            [curr._id]: curr.name,
          }),
          {} as Record<string, string>,
        );
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
        const interfaceEdges = await topologyDiscoveryAPI.getHas(unwrap(config.topologyDiscoveryURL));
        const oldInterfaceEdges = getOldTopologyInterfaceEdges(interfaceEdges, result);

        const interfaceDeviceMap = oldInterfaceEdges.reduce<Record<string, string>>((acc, curr, i, arr) => {
          const dvc = unwrap(arr.find((int) => int._to === curr._to)?._from);
          return {
            ...acc,
            [curr._to]: dvc,
          };
        }, {} as Record<string, string>);
        const interfaceMap = oldInterfaceEdges.reduce<Record<string, string[]>>(
          (acc, curr) => ({
            ...acc,
            [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], curr._to] : [curr._to],
          }),
          {} as Record<string, string[]>,
        );

        const nodesMap = oldDevices.reduce(
          (acc, curr) => ({
            ...acc,
            [curr._id]: curr.name,
          }),
          {} as Record<string, string>,
        );

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
          })),
          edges: oldEdges,
        };
      },
    });
  },
});
