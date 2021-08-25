import { extendType, idArg, interfaceType, nonNull, objectType } from 'nexus';
import countries from 'i18n-iso-countries';
import {
  getDeviceInstallConverter,
  convertDBDevice,
  convertDBZone,
  convertDBLabel,
  convertDBLocation,
} from '../helpers/converters';
import { fromGraphId, getType } from '../helpers/id-helper';
import { getInstalledDevices } from '../external-api/uniconfig';
import { makeUniconfigURL } from '../helpers/zone.helpers';

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
          const dbDevice = await prisma.device.findFirst({
            where: { id, tenantId },
          });
          if (dbDevice == null) {
            return null;
          }
          const device = convertDBDevice(dbDevice);
          if (dbDevice == null) {
            throw new Error('device not found');
          }
          const uniconfigURL = await makeUniconfigURL(prisma, dbDevice.uniconfigZoneId);
          const installedDevices = await getInstalledDevices(uniconfigURL);
          const convertFn = getDeviceInstallConverter(installedDevices.output.nodes ?? []);
          return convertFn(device);
        }
        if (type === 'Zone') {
          const id = fromGraphId('Zone', args.id);
          const dbZone = await prisma.uniconfigZone.findFirst({
            where: { id, tenantId },
          });
          if (dbZone == null) {
            return null;
          }
          return convertDBZone(dbZone);
        }
        if (type === 'Label') {
          const id = fromGraphId('Label', args.id);
          const dbLabel = await prisma.label.findFirst({ where: { id, tenantId } });
          if (dbLabel == null) {
            return null;
          }
          return convertDBLabel(dbLabel);
        }
        if (type === 'Location') {
          const id = fromGraphId('Location', args.id);
          const dbLocation = await prisma.location.findFirst({ where: { id, tenantId } });
          if (dbLocation == null) {
            return null;
          }
          return convertDBLocation(dbLocation);
        }
        if (type === 'Country') {
          const id = fromGraphId('Country', args.id);
          if (countries.isValid(id)) {
            return null;
          }
          const countryName = countries.getName(id, 'en', { select: 'official' });
          return {
            id: args.id,
            code: id,
            name: countryName,
          };
        }
        return null;
      },
    });
  },
});
