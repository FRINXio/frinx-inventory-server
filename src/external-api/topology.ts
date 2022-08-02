import { Database } from 'arangojs';
import { CollectionMetadata } from 'arangojs/collection';
import config from '../config';

class Connection {
  private db: Database | null;
  private static instance: Connection;

  private constructor() {
    try {
      this.db = new Database({
        url: config.arangoURL,
        databaseName: config.arangoDb,
      });
      this.db.login(config.arangoUser, config.arangoPassword);
    } catch (e) {
      this.db = null;
      console.log(`Could not initialize arango connection to: ${config.arangoURL}`);
    }
  }

  public static getInstance(): Connection {
    if (!Connection.instance) {
      Connection.instance = new Connection();
    }
    return Connection.instance;
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error(`Database connection is closed to: ${config.arangoURL}`);
    }
    return this.db;
  }
}

const db = Connection.getInstance().getDatabase();

async function getCollections(): Promise<CollectionMetadata[]> {
  return db.listCollections();
}

const topologyAPI = {
  getCollections,
};

export function getTopologyAPI(): TopologyAPI | undefined {
  if (config.topologyEnabled) {
    return topologyAPI;
  }
}

export type TopologyAPI = typeof topologyAPI;
