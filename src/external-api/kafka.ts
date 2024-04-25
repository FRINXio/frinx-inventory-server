import { Consumer, Kafka, Producer } from 'kafkajs';
import config from '../config';
import { Device } from '../schema/source-types';
import { encodeDeviceForInventoryKafka } from '../helpers/device-helpers';

const KAFKA_BROKER = config.kafkaBroker || '';
const KAFKA_TOPIC = config.kafkaTopic || '';

class KafkaService {
  private kafka: Kafka;

  private producer: Producer;

  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      brokers: [KAFKA_BROKER],
    });
    this.producer = KafkaService.createProducer(this.kafka);
    this.consumer = KafkaService.createConsumer(this.kafka);
  }

  public async producerConnect(): Promise<void> {
    try {
      await this.producer.connect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error connecting to Kafka:', error);
      throw error;
      null;
    }
  }

  public async consumerConnect(): Promise<void> {
    try {
      await this.consumer.connect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error connecting to Kafka:', error);
      throw error;
    }
  }

  public async producerDisconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  public async consumerDisconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  public async send(key: string, value: Record<string, unknown>, headers: Record<string, string>): Promise<void> {
    try {
      await this.producerConnect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`Error connecting to Kafka: ${error}`);
    }

    await this.producer.send({
      messages: [
        {
          key,
          value: JSON.stringify(value),
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'content-type': 'application/json',
            ...headers,
          },
        },
      ],
      topic: KAFKA_TOPIC,
    });
    await this.producerDisconnect();
  }

  isHealthy = async () => {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();

      return topics.length > 0 && topics.includes(KAFKA_TOPIC);
    } catch (error) {
      return false;
      // Handle error appropriately, e.g., raise an alert or retry
    } finally {
      await admin.disconnect();
    }
  };

  private static createProducer(kafka: Kafka): Producer {
    return kafka.producer();
  }

  private static createConsumer(kafka: Kafka): Consumer {
    return kafka.consumer({
      groupId: 'inventory-service',
    });
  }
}

async function produceDeviceRegistrationEvent(
  kafka: Omit<KafkaService, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    await kafka.send(device.name, encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
      type: 'device_registration',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error sending device registration event to Kafka:', error);
    throw error;
  }
}

async function produceDeviceRemovalEvent(
  kafka: Omit<KafkaService, 'connect'> | null,
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

async function produceDeviceUpdateEvent(
  kafka: Omit<KafkaService, 'connect'> | null,
  device: Device,
  coordinates: [number, number],
  labelIds: string[],
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    await kafka.send(device.name, encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
      type: 'device_update',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error sending device update event to Kafka:', error);
    throw error;
  }
}

const kafkaProducers = {
  produceDeviceRegistrationEvent,
  produceDeviceRemovalEvent,
  produceDeviceUpdateEvent,
};

export default kafkaProducers;
export { KafkaService };
