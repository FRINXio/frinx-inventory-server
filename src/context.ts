import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import { IncomingHttpHeaders } from 'http';
import topologyDiscoveryAPI, { TopologyDiscoveryAPI } from './external-api/topology-discovery';
import getTopologyDiscoveryApi, { TopologyDiscoveryGraphQLAPI } from './external-api/topology-discovery-graphql';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  topologyDiscoveryAPI: TopologyDiscoveryAPI;
  topologyDiscoveryGraphQLAPI?: TopologyDiscoveryGraphQLAPI;
};

function getTenantIdFromHeaders(headers: IncomingHttpHeaders): string {
  if (headers['x-tenant-id'] == null) {
    return 'frinx';
  }
  if (Array.isArray(headers['x-tenant-id'])) {
    return headers['x-tenant-id'][0];
  }
  return headers['x-tenant-id'];
}

export default async function createContext(context: ExpressContextFunctionArgument): Promise<Context> {
  const { req } = context;
  const { headers } = req;
  const tenantId = getTenantIdFromHeaders(headers);

  return {
    prisma: prismaClient,
    tenantId,
    uniconfigAPI,
    topologyDiscoveryAPI,
    topologyDiscoveryGraphQLAPI: getTopologyDiscoveryApi(),
  };
}

export function createSubscriptionContext() {
  return {
    prisma: prismaClient,
  };
}
