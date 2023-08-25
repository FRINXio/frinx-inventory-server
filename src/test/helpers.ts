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

export function createTestContext(): TestContext {
  const ctx = {} as TestContext;
  const graphqlCtx = graphqlTestContext();
  const prismaCtx = prismaTestContext();

  beforeEach(async () => {
    const client = await graphqlCtx.before();
    const db = await prismaCtx.before();
    Object.assign(ctx, {
      client,
      db,
    });
  });

  afterEach(async () => {
    await graphqlCtx.after();
    await prismaCtx.after();
  });
  return ctx;
}
