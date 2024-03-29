import { extendType, list, nonNull, objectType, stringArg } from 'nexus';
import { SuccessTransactionType, TransactionType } from '../external-api/network-types';
import { fromGraphId } from '../helpers/id-helper';
import { unwrap } from '../helpers/utils.helpers';
import { getUniconfigURL, makeUniconfigURL } from '../helpers/zone.helpers';
import { Device } from './device';

function ensureSuccessTransaction(transaction: TransactionType): transaction is SuccessTransactionType {
  return transaction.status === 'SUCCESS';
}

export const TransactionDiff = objectType({
  name: 'TransactionDiff',
  definition: (t) => {
    t.nonNull.string('path');
    t.string('dataBefore');
    t.string('dataAfter');
  },
});

export const TransactionChange = objectType({
  name: 'TransactionChange',
  definition: (t) => {
    t.nonNull.field('device', { type: Device });
    t.nonNull.field('diff', { type: nonNull(list(nonNull(TransactionDiff))) });
  },
});

export const Transaction = objectType({
  name: 'Transaction',
  definition: (t) => {
    t.nonNull.string('transactionId');
    t.nonNull.string('lastCommitTime');
    t.nonNull.field('changes', { type: nonNull(list(nonNull(TransactionChange))) });
  },
});

export const TransactionQuery = extendType({
  type: 'Query',
  definition: (t) => {
    t.field('transactions', {
      type: nonNull(list(nonNull(Transaction))),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      resolve: async (_, __, { uniconfigAPI, tenantId, prisma }) => {
        const dbZones = await prisma.uniconfigZone.findMany({ where: { tenantId } });
        const uniconfigURLs = dbZones.map((z) => makeUniconfigURL(z.name));
        try {
          const transactionLogs = await Promise.all(uniconfigURLs.map((url) => uniconfigAPI.getTransactionLog(url)));
          const transactions = transactionLogs.map((tr) => tr['transactions-metadata']['transaction-metadata']).flat();
          const dbDevices = await prisma.device.findMany({ where: { tenantId } });
          const deviceNames = dbDevices.map((device) => device.name);
          const filteredTransactions = transactions
            .filter(ensureSuccessTransaction)
            .filter((tr) => tr.metadata.every((m) => deviceNames.includes(m['node-id'])));
          return filteredTransactions
            .map((transaction) => ({
              transactionId: transaction['transaction-id'],
              lastCommitTime: new Date(transaction['last-commit-time']).toISOString(),
              changes: transaction.metadata.map((mtd) => {
                const device = unwrap(dbDevices.find((dbd) => dbd.name === mtd['node-id']));
                return {
                  device,
                  diff:
                    mtd.diff?.map((d) => ({
                      path: d.path,
                      dataAfter: d['data-after'] != null ? String(d['data-after']) : null,
                      dataBefore: d['data-before'] != null ? String(d['data-before']) : null,
                    })) ?? [],
                };
              }),
            }))
            .sort((a, b) => new Date(b.lastCommitTime).getTime() - new Date(a.lastCommitTime).getTime());
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

export const RevertChangesPayload = objectType({
  name: 'RevertChangesPayload',
  definition: (t) => {
    t.nonNull.boolean('isOk');
  },
});

export const RevertChangesMutation = extendType({
  type: 'Mutation',
  definition: (t) => {
    t.nonNull.field('revertChanges', {
      type: RevertChangesPayload,
      args: { transactionId: nonNull(stringArg()) },
      resolve: async (_, args, { uniconfigAPI, tenantId, prisma }) => {
        const dbZones = await prisma.uniconfigZone.findMany({ where: { tenantId } });
        const uniconfigURLs = dbZones.map((z) => makeUniconfigURL(z.name));
        const transactionLogs = await Promise.all(uniconfigURLs.map((url) => uniconfigAPI.getTransactionLog(url)));
        const transactions = transactionLogs.map((tr) => tr['transactions-metadata']['transaction-metadata']).flat();
        const matchingTransaction = transactions.find((tr) => tr['transaction-id'] === args.transactionId);

        if (matchingTransaction == null || matchingTransaction.status === 'FAILED') {
          throw new Error('transaction not found');
        }
        const dbZone = await prisma.device
          .findFirst({
            where: { tenantId, name: matchingTransaction.metadata[0]['node-id'] },
          })
          .uniconfigZone();
        if (dbZone == null) {
          throw new Error('should not happen');
        }
        const uniconfigURL = makeUniconfigURL(dbZone.name);
        try {
          await uniconfigAPI.revertChanges(uniconfigURL, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            input: { 'target-transactions': { transaction: [args.transactionId] }, 'ignore-non-existing-nodes': true },
          });

          return { isOk: true };
        } catch (e) {
          return { isOk: false };
        }
      },
    });
  },
});
