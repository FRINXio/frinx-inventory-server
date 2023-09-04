import { PrismaClient } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';
import topologyDiscoveryAPI, { TopologyDiscoveryAPI } from './external-api/topology-discovery';
import getTopologyDiscoveryApi, { TopologyDiscoveryGraphQLAPI } from './external-api/topology-discovery-graphql';
import conductorAPI, { ConductorAPI } from './external-api/conductor';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import schedulerAPI, { SchedulerAPI } from './external-api/scheduler';
import resourceManagerAPI, { ResourceManagerAPI } from './external-api/resource-manager';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  topologyDiscoveryAPI: TopologyDiscoveryAPI;
  topologyDiscoveryGraphQLAPI?: TopologyDiscoveryGraphQLAPI;
  conductorAPI: ConductorAPI;
  schedulerAPI: SchedulerAPI;
  resourceManagerAPI: ResourceManagerAPI;
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

  return {
    prisma: prismaClient,
    tenantId,
    uniconfigAPI,
    topologyDiscoveryAPI,
    topologyDiscoveryGraphQLAPI: getTopologyDiscoveryApi(),
    conductorAPI,
    schedulerAPI,
    resourceManagerAPI,
  };
}

export function createSubscriptionContext() {
  return {
    conductorAPI,
    schedulerAPI,
    prisma: prismaClient,
  };
}
