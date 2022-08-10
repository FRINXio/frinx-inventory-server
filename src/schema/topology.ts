import { extendType, nonNull, objectType } from 'nexus';
import { toGraphId } from '../helpers/id-helper';
import { omitNullValue } from '../helpers/omit-null-value';
import unwrap from '../helpers/unwrap';

export const GraphNode = objectType({
  name: 'GraphNode',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.field('device', { type: 'Device' });
  },
});

export const GraphEdge = objectType({
  name: 'GraphEdge',
  definition: (t) => {
    t.nonNull.id('id');
    t.nonNull.string('source');
    t.nonNull.string('target');
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
        const interfaceMap = interfaceEdges.reduce<Record<string, string>>((acc, curr, i, arr) => {
          const dvc = unwrap(arr.find((int) => int._to === curr._to)?._from);
          return {
            ...acc,
            [curr._to]: dvc,
          };
        }, {} as Record<string, string>);
        const dbDevices = await prisma.device.findMany({ where: { tenantId } });
        const graph = await arangoClient.getGraph();
        const { nodes, edges } = graph;
        return {
          nodes: dbDevices
            .map((device) => {
              const node = nodes.find((n) => n._id === device.name);
              if (node != null) {
                return {
                  id: toGraphId('GraphNode', node._key),
                  device,
                };
              }
              return null;
            })
            .filter(omitNullValue),
          edges: edges
            .map((edge) => {
              const device = dbDevices.find((dvc) => dvc.name === interfaceMap[edge._from] && interfaceMap[edge._to]);
              if (device != null) {
                return {
                  id: toGraphId('GraphEdge', edge._key),
                  source: interfaceMap[edge._from],
                  target: interfaceMap[edge._to],
                };
              }
              return null;
            })
            .filter(omitNullValue),
        };
      },
    });
  },
});
