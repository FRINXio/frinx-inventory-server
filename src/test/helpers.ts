/* eslint-env jest */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { once } from 'events';
import getPort, { makeRange } from 'get-port';
import { GraphQLClient } from 'graphql-request';
import { Server } from 'http';
import { join } from 'path';
import prismaClient from '../prisma-client';
import { server } from '../server';
import kafkaProducers, { KafkaService } from '../external-api/kafka';

type TestContext = {
  client: GraphQLClient;
  db: PrismaClient;
};

function graphqlTestContext() {
  let serverInstance: Server | null = null;
  return {
    async before() {
      const port = await getPort({ port: makeRange(4005, 6000) });

      serverInstance = server.listen({ port });
      await once(serverInstance, 'listening');
      return new GraphQLClient(`http://localhost:${port}/graphql`, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'x-tenant-id': process.env.X_TENANT_ID ?? '',
        },
      });
    },
    async after() {
      if (serverInstance) {
        serverInstance.close();
        await once(serverInstance, 'close');
      }
    },
  };
}
function prismaTestContext() {
  const prismaBinary = join(__dirname, '../..', 'node_modules', '.bin', 'prisma');
  return {
    async before() {
      // Run the migrations to ensure our schema has the required structure
      execSync(`${prismaBinary} db push`);
      // Construct a new Prisma Client connected to the generated schema
      return prismaClient;
    },
    async after() {
      await prismaClient?.$disconnect();
    },
  };
}

function kafkaTestContext() {
  const kafka = new KafkaService();
  return {
    async before() {
      return kafka;
    },
    async after() {
      // await kafka.producerDisconnect();
      // await kafka.consumerDisconnect();
    },
  };
}

export function createTestContext(): TestContext {
  const ctx = {} as TestContext;
  const graphqlCtx = graphqlTestContext();
  const prismaCtx = prismaTestContext();
  const kafkaCtx = kafkaTestContext();

  beforeEach(async () => {
    const client = await graphqlCtx.before();
    const db = await prismaCtx.before();
    const kafka = await kafkaCtx.before();
    Object.assign(ctx, {
      client,
      db,
      kafka,
      ...kafkaProducers,
    });
  });

  afterEach(async () => {
    await graphqlCtx.after();
    await prismaCtx.after();
    await kafkaCtx.after();
  });
  return ctx;
}
