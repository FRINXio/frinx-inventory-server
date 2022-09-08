import { extendType, nonNull, objectType } from 'nexus';
import { toGraphId } from '../helpers/id-helper';
import { omitNullValue } from '../helpers/omit-null-value';
import unwrap from '../helpers/unwrap';

export const GraphNode = objectType({
  name: 'GraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.field('device', { type: 'Device' });
    t.nonNull.list.nonNull.string('interfaces');
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

export const TopologyQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.nonNull.field('topology', {
      type: nonNull(Topology),
      resolve: async (root, _, { prisma, arangoClient, tenantId }) => {
        if (arangoClient == null) {
          throw new Error('should not happen');
        }
        const interfaceEdges = await arangoClient.getInterfaceEdges();
        const interfaceDeviceMap = interfaceEdges.reduce<Record<string, string>>((acc, curr, i, arr) => {
          const dvc = unwrap(arr.find((int) => int._to === curr._to)?._from);
          return {
            ...acc,
            [curr._to]: dvc,
          };
        }, {} as Record<string, string>);
        const interfaceMap = interfaceEdges.reduce<Record<string, string[]>>(
          (acc, curr) => ({
            ...acc,
            [curr._from]: acc[curr._from]?.length ? [...acc[curr._from], curr._to] : [curr._to],
          }),
          {} as Record<string, string[]>,
        );
        const dbDevices = await prisma.device.findMany({ where: { tenantId } });
        const graph = await arangoClient.getGraph();
        const { nodes, edges } = graph;
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
  },
});
