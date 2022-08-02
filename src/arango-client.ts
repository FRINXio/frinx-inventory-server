import { Database } from 'arangojs';
import { CollectionMetadata } from 'arangojs/collection';
import config from './config';

class Connection {
  private db: Database;

  private static instance: Connection;

  private constructor() {
    if (config.arangoEnabled === false) {
      throw new Error('Arango connection should be defined in .env file');
    }

    this.db = new Database({
      url: config.arangoURL,
      databaseName: config.arangoDb,
    });
    this.db.login(config.arangoUser, config.arangoPassword);
  }

  public static getInstance(): Connection {
    if (!Connection.instance) {
      Connection.instance = new Connection();
    }
    return Connection.instance;
  }

  public getDatabase(): Database {
    return this.db;
  }
}

function initClient() {
  const db = Connection.getInstance().getDatabase();

  async function getCollections(): Promise<CollectionMetadata[]> {
    return db.listCollections();
  }

  return {
    getCollections,
  };
}

export function getArangoClient(): ArangoClient | undefined {
  if (!config.arangoEnabled) {
    return undefined;
  }

  initClient();
}

export type ArangoClient = ReturnType<typeof initClient>;
