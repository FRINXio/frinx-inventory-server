import { PrismaClient } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import topologyDiscoveryAPI, { TopologyDiscoveryAPI } from './external-api/topology-discovery';
import { ArangoClient, getArangoClient } from './arango-client';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  arangoClient?: ArangoClient;
  topologyDiscoveryAPI: TopologyDiscoveryAPI;
};

export default function createContext(context: ExpressContext): Context {
  const { req } = context;
  const { headers } = req;
  let tenantId: string;
  if (headers['x-tenant-id'] == null) {
    // throw new Error('tenant id is missing');
    tenantId = 'frinx';
  } else {
    tenantId = headers['x-tenant-id'] as string;
  }

  const arangoClient = getArangoClient();

  return { prisma: prismaClient, tenantId, uniconfigAPI, arangoClient, topologyDiscoveryAPI };
}
