import { Consumer, Kafka, Producer } from 'kafkajs';
import config from '../config';
import { Device } from '../schema/source-types';
import { encodeDeviceForInventoryKafka } from '../helpers/device-helpers';

const KAFKA_BROKER = config.kafkaBroker || '';
const KAFKA_TOPIC = config.kafkaTopic || '';
const SESSION_TIMEOUT = 30000;

class KafkaProducer {
  private producer: Producer;

  private consumer: Consumer;

  constructor() {
    this.producer = KafkaProducer.createProducer();
    this.consumer = KafkaProducer.createConsumer();
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

  public async send(msg: Record<string, unknown>, headers: Record<string, string>): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      console.log(`Error connecting to Kafka: ${error}`);
    }

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
    });
    await this.disconnect();
  }

  isHealthy = async () => {
    const { HEARTBEAT } = this.consumer.events;
    let lastHeartbeat = 0;
    this.consumer.on(HEARTBEAT, ({ timestamp }) => {
      lastHeartbeat = timestamp;
    });
    // Consumer has heartbeat within the session timeout,
    // so it is healthy
    if (Date.now() - lastHeartbeat < SESSION_TIMEOUT) {
      return true;
    }

    // Consumer has not heartbeat, but maybe it's because the group is currently rebalancing
    try {
      const { state } = await this.consumer.describeGroup();

      return ['CompletingRebalance', 'PreparingRebalance'].includes(state.toString());
    } catch (err) {
      return false;
    }
  };

  private static createProducer(): Producer {
    const kafka = new Kafka({
      brokers: [KAFKA_BROKER],
    });

    return kafka.producer();
  }

  private static createConsumer(): Consumer {
    const kafka = new Kafka({
      brokers: [KAFKA_BROKER],
    });

    return kafka.consumer({
      groupId: 'inventory-service',
    });
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

  try {
    await kafka.send(encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
      type: 'device_registration',
    });
  } catch (error) {
    console.log('Error sending device registration event to Kafka:', error);
    throw error;
  }
}

async function produceDeviceRemovalEvent(
  kafka: Omit<KafkaProducer, 'connect'> | null,
  deviceName: string,
): Promise<void> {
  if (kafka == null) {
    throw new Error('Kafka producer is not initialized');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await kafka.send({ device_name: deviceName }, { type: 'device_removal' });
  } catch (error) {
    console.log('Error sending device removal event to Kafka:', error);
    throw error;
  }
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

  try {
    await kafka.send(encodeDeviceForInventoryKafka(device, { type: 'Point', coordinates }, labelIds), {
      type: 'device_update',
    });
  } catch (error) {
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
export { KafkaProducer };
