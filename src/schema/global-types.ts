import { extendType, idArg, interfaceType, nonNull, objectType } from 'nexus';
import { getDeviceInstallConverter, convertDBDevice, convertDBZone } from '../helpers/converters';
import { fromGraphId, getType } from '../helpers/id-helper';
import { getInstalledDevices } from '../external-api/uniconfig';

export const Node = interfaceType({
  name: 'Node',
  definition: (t) => {
    t.nonNull.id('id');
  },
  resolveType: (item) => getType(item.id),
});
export const PageInfo = objectType({
  name: 'PageInfo',
  definition: (t) => {
    t.string('startCursor');
    t.string('endCursor');
    t.nonNull.boolean('hasNextPage');
    t.nonNull.boolean('hasPreviousPage');
  },
});
export const NodeQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('node', {
      type: Node,
      args: {
        id: nonNull(idArg()),
      },
      resolve: async (_, args, { prisma, tenantId }) => {
        const type = getType(args.id);
        if (type === 'Device') {
          const id = fromGraphId('Device', args.id);
          const dbDevice = await prisma.device_inventory.findFirst({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            where: { id, AND: { uniconfig_zones: { tenant_id: tenantId } } },
          });
          if (dbDevice == null) {
            return null;
          }
          const device = convertDBDevice(dbDevice);
          const installedDevices = await getInstalledDevices('http://localhost:4000/api/uniconfig');
          const convertFn = getDeviceInstallConverter(installedDevices.output.nodes ?? []);
          return convertFn(device);
        }
        if (type === 'Zone') {
          const id = fromGraphId('Zone', args.id);
          const dbZone = await prisma.uniconfig_zones.findFirst({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            where: { id, AND: { tenant_id: tenantId } },
          });
          if (dbZone == null) {
            return null;
          }
          return convertDBZone(dbZone);
        }
        return null;
      },
    });
  },
});
