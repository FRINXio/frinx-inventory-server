import { Kafka, logLevel, Producer } from 'kafkajs';
import config from '../config';
import { Device } from '../schema/source-types';
import { decodeMetadataOutput } from '../helpers/device-types';
import prismaClient from '../prisma-client';

const KAFKA_BROKER = config.kafkaBroker || '';
const KAFKA_TOPIC = config.kafkaTopic || '';

class KafkaProducer {
  private producer: Producer;

  constructor(logLvl: logLevel = logLevel.NOTHING) {
    this.producer = KafkaProducer.createProducer(logLvl);
  }

  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error connecting to Kafka:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  public async send(msg: Record<string, unknown>, headers: Record<string, string>, timeout?: number): Promise<void> {
    await this.producer.send({
      messages: [
        {
          value: JSON.stringify(msg),
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'content-type': 'application/json',
            ...headers,
          },
        },
      ],
      topic: KAFKA_TOPIC,
      timeout,
    });
  }

  private static createProducer(logLvl: logLevel): Producer {
    const kafka = new Kafka({
      clientId: 'elisa-polystar-slovakia',
      brokers: [KAFKA_BROKER],
      logLevel: logLvl,
    });

    return kafka.producer();
  }
}

async function produceDeviceRegistrationEvent(kafka: KafkaProducer, device: Device): Promise<void> {
  await kafka.send(
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      device_name: device.name,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      device_size: decodeMetadataOutput(device.metadata)?.deviceSize ?? 'MEDIUM',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      device_type: device.deviceType,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      device_address: device.macAddress,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      device_port: device.port,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      zone_id: device.uniconfigZoneId,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      service_state: device.serviceState,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      mount_parameters: device.mountParameters,
      vendor: device.vendor,
      model: device.model,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      blueprint_id: device.blueprintId,
      username: device.username,
      password: device.password,
      version: device.version,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      labels_ids: [],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      geo_location: prismaClient.location.findUnique({ where: { id: device.locationId ?? undefined } }),
    },
    { type: 'device_registration' },
  );
}

async function produceDeviceRemovalEvent(kafka: KafkaProducer, deviceName: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  await kafka.send({ device_name: deviceName }, { type: 'device_removal' });
}

async function produceDeviceUpdateEvent(kafka: KafkaProducer, device: Device): Promise<void> {
  await kafka.send(device, { type: 'device_update' });
}

const kafkaProducers = {
  deviceInventory: {
    produceDeviceRegistrationEvent,
    produceDeviceRemovalEvent,
    produceDeviceUpdateEvent,
  },
};

export default kafkaProducers;
export { KafkaProducer };
