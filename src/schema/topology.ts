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
        const deviceMap = dbDevices.reduce((acc, curr) => {
          const nodeDev = nodes.find((n) => n.name === curr.name);
          return {
            ...acc,
            [curr.name]: nodeDev?._id ?? '',
          };
        }, {} as Record<string, string>);
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
                };
              }
              return null;
            })
            .filter(omitNullValue),
          edges: edges
            .map((edge) => {
              const device = dbDevices.find(
                (dvc) =>
                  deviceMap[dvc.name] === interfaceMap[edge._from] || deviceMap[dvc.name] === interfaceMap[edge._to],
              );
              if (device != null) {
                return {
                  id: toGraphId('GraphEdge', edge._key),
                  source: nodesMap[interfaceMap[edge._from]],
                  target: nodesMap[interfaceMap[edge._to]],
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
