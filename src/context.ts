import { PrismaClient } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import { TopologyAPI, getTopologyAPI } from './external-api/topology';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  topologyAPI?: TopologyAPI;
};

export default function createContext(context: ExpressContext): Context {
  const { req } = context;

  const { headers } = req;
  if (headers['x-tenant-id'] == null) {
    throw new Error('tenant id is missing');
  }
  const tenantId = headers['x-tenant-id'] as string;

  const topologyAPI = getTopologyAPI();

  return { prisma: prismaClient, tenantId, uniconfigAPI, topologyAPI };
}
