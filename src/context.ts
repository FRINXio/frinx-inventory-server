import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import { IncomingHttpHeaders } from 'http';
import topologyDiscoveryAPI, { TopologyDiscoveryAPI } from './external-api/topology-discovery';
import getTopologyDiscoveryApi, { TopologyDiscoveryGraphQLAPI } from './external-api/topology-discovery-graphql';
import uniconfigAPI, { UniConfigAPI } from './external-api/uniconfig';
import prismaClient from './prisma-client';
import config from './config';
import kafkaProducers, { KafkaService } from './external-api/kafka';

export type Context = {
  kafka: KafkaService | null;
  prisma: PrismaClient;
  tenantId: string;
  uniconfigAPI: UniConfigAPI;
  topologyDiscoveryAPI: TopologyDiscoveryAPI;
  topologyDiscoveryGraphQLAPI?: TopologyDiscoveryGraphQLAPI;
  inventoryKafka: typeof kafkaProducers;
};

function getTenantIdFromHeaders(headers: IncomingHttpHeaders): string {
  if (headers['x-tenant-id'] == null) {
    return config.defaultTenantId;
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
  const kafka = new KafkaService();

  return {
    kafka,
    prisma: prismaClient,
    tenantId,
    uniconfigAPI,
    topologyDiscoveryAPI,
    topologyDiscoveryGraphQLAPI: getTopologyDiscoveryApi(),
    inventoryKafka: kafkaProducers,
  };
}

export function createSubscriptionContext() {
  return {
    prisma: prismaClient,
  };
}
