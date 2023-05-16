import { PrismaClient } from '@prisma/client';
import { ExpressContext } from 'apollo-server-express';
import topologyDiscoveryAPI, { TopologyDiscoveryAPI } from './external-api/topology-discovery';
import conductorAPI, { ConductorAPI } from './external-api/conductor';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import schedulerAPI, { SchedulerAPI } from './external-api/scheduler';
import prismaClient from './prisma-client';

export type Context = {
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  topologyDiscoveryAPI: TopologyDiscoveryAPI;
  conductorAPI: ConductorAPI;
  schedulerAPI: SchedulerAPI;
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

  return { prisma: prismaClient, tenantId, uniconfigAPI, topologyDiscoveryAPI, conductorAPI, schedulerAPI };
}

export function createDynamicContext() {
  return {
    conductorAPI,
    schedulerAPI,
    prisma: prismaClient,
  };
}
