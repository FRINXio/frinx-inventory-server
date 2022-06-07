import { extendType, list, nonNull, objectType, stringArg } from 'nexus';
import { fromGraphId } from '../helpers/id-helper';
import { getUniconfigURL, makeUniconfigURL } from '../helpers/zone.helpers';

export const Transaction = objectType({
  name: 'Transaction',
  definition: (t) => {
    t.nonNull.string('transactionId');
    t.nonNull.string('lastCommitTime');
  },
});

export const TransactionQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('transactions', {
      type: list(Transaction),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      resolve: async (_, __, { uniconfigAPI, tenantId, prisma }) => {
        const dbZones = await prisma.uniconfigZone.findMany({ where: { tenantId } });
        const uniconfigURLs = dbZones.map((z) => makeUniconfigURL(z.name));
        try {
          const transactionLogs = await Promise.all(uniconfigURLs.map((url) => uniconfigAPI.getTransactionLog(url)));
          const transactions = transactionLogs.map((tr) => tr['transactions-metadata']['transaction-metadata']).flat();
          const dbDevices = await prisma.device.findMany({ where: { tenantId } });
          const deviceNames = dbDevices.map((device) => device.name);
          const filteredTransactions = transactions.filter((tr) =>
            tr.metadata.every((m) => deviceNames.includes(m['node-id'])),
          );
          return filteredTransactions.map((transaction) => ({
            transactionId: transaction['transaction-id'],
            lastCommitTime: transaction['last-commit-time'],
          }));
        } catch (e) {
          return [];
        }
      },
    });
  },
});

export const CreateTransactionPayload = objectType({
  name: 'CreateTransactionPayload',
  definition: (t) => {
    t.string('transactionId');
  },
});

export const CreateTransactionMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('createTransaction', {
      type: CreateTransactionPayload,
      args: { deviceId: nonNull(stringArg()) },
      resolve: async (_, args, { uniconfigAPI, prisma, tenantId }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId, tenantId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        const transactionId = await uniconfigAPI.createTransaction(uniconfigURL);
        return { transactionId };
      },
    });
  },
});

export const CloseTransactionPayload = objectType({
  name: 'CloseTransactionPayload',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});

export const CloseTransactionMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('closeTransaction', {
      type: CloseTransactionPayload,
      args: { deviceId: nonNull(stringArg()), transactionId: nonNull(stringArg()) },
      resolve: async (_, args, { uniconfigAPI, prisma, tenantId }) => {
        const nativeDeviceId = fromGraphId('Device', args.deviceId);
        const dbDevice = await prisma.device.findFirst({ where: { id: nativeDeviceId, tenantId } });
        if (dbDevice == null) {
          throw new Error('device not found');
        }
        const uniconfigURL = await getUniconfigURL(prisma, dbDevice.uniconfigZoneId);
        try {
          await uniconfigAPI.closeTransaction(uniconfigURL, args.transactionId);
          // we have to do this, as close-transaction API call returns code 200 without response body wich throws an error
          // eslint-disable-next-line no-empty
        } catch (e) {}
        return { isOk: true };
      },
    });
  },
});
