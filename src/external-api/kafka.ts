import { Kafka, logLevel, Producer } from 'kafkajs';
import config from '../config';
import { Device } from '../schema/source-types';
import { encodeDeviceForInventoryKafka } from '../helpers/device-helpers';

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

  public async isConnected(): Promise<boolean> {
    try {
      await this.producer.connect();

      return true;
    } catch (error) {
      return false;
    }
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

async function produceDeviceRegistrationEvent(
  kafka: Omit<KafkaProducer, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  await kafka.send(encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
    type: 'device_registration',
  });
}

async function produceDeviceRemovalEvent(
  kafka: Omit<KafkaProducer, 'connect'> | null,
  deviceName: string,
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  await kafka.send({ device_name: deviceName }, { type: 'device_removal' });
}

async function produceDeviceUpdateEvent(
  kafka: Omit<KafkaProducer, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  await kafka.send(encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
    type: 'device_update',
  });
}

const kafkaProducers = {
  produceDeviceRegistrationEvent,
  produceDeviceRemovalEvent,
  produceDeviceUpdateEvent,
};

export default kafkaProducers;
export { KafkaProducer };
