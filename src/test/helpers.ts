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
import { Device } from '../schema/source-types';
import { encodeDeviceForInventoryKafka } from '../helpers/device-helpers';

type TestContext = {
  client: GraphQLClient;
  db: PrismaClient;
  kafka: KafkaMockService;
  inventoryKafka: {
    produceDeviceRegistrationEvent: (
      device: Device,
      coordinates: [number, number],
      labelIds: string[],
    ) => Promise<void>;
    produceDeviceRemovalEvent: (deviceName: string) => Promise<void>;
    produceDeviceUpdateEvent: (device: Device, coordinates: [number, number], labelIds: string[]) => Promise<void>;
  };
};

class KafkaMockService {
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public async producerConnect(): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public async consumerConnect(): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public async producerDisconnect(): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  public async consumerDisconnect(): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  public async send(_key: string, _value: Record<string, unknown>, _headers: Record<string, string>): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this
  isHealthy = async () => true;
}

async function produceDeviceRegistrationEventMock(
  kafka: Omit<KafkaMockService, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    await kafka.send(device.name, encodeDeviceForInventoryKafka(device, { type: 'POINT', coordinates }, labelIds), {
      type: 'device_registration',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error sending device registration event to Kafka:', error);
    throw error;
  }
}

async function produceDeviceRemovalEventMock(
  kafka: Omit<KafkaMockService, 'connect'> | null,
  deviceName: string,
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await kafka.send(deviceName, { device_name: deviceName }, { type: 'device_removal' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error sending device removal event to Kafka:', error);
    throw error;
  }
}

async function produceDeviceUpdateEventMock(
  kafka: Omit<KafkaMockService, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    await kafka.send(device.name, encodeDeviceForInventoryKafka(device, { type: 'POINT', coordinates }, labelIds), {
      type: 'device_update',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error sending device update event to Kafka:', error);
    throw error;
  }
}

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
  const kafka = new KafkaMockService();

  beforeEach(async () => {
    const client = await graphqlCtx.before();
    const db = await prismaCtx.before();
    Object.assign(ctx, {
      client,
      db,
      kafka,
      inventoryKafka: {
        produceDeviceRegistrationEvent: produceDeviceRegistrationEventMock.bind(null, kafka),
        produceDeviceRemovalEvent: produceDeviceRemovalEventMock.bind(null, kafka),
        produceDeviceUpdateEvent: produceDeviceUpdateEventMock.bind(null, kafka),
      },
    });
  });

  afterEach(async () => {
    await graphqlCtx.after();
    await prismaCtx.after();
  });
  return ctx;
}
