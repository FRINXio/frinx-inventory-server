import { PrismaClient } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import { ArangoClient, getArangoClient } from './arango-client';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  arangoClient?: ArangoClient;
};

export default function createContext(context: ExpressContext): Context {
  const { req } = context;

  const { headers } = req;
  if (headers['x-tenant-id'] == null) {
    throw new Error('tenant id is missing');
  }
  const tenantId = headers['x-tenant-id'] as string;

  const arangoClient = getArangoClient();

  return { prisma: prismaClient, tenantId, uniconfigAPI, arangoClient };
}
