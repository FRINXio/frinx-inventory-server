import { aql, Database } from 'arangojs';
import { CollectionMetadata } from 'arangojs/collection';
import config from './config';

export type ArangoDevice = {
  _key: string;
  _id: string;
  _rev: string;
  name: string;
};
export type ArangoEdge = {
  _key: string;
  _id: string;
  _from: string;
  _to: string;
  _rev: string;
};
export type ArangoGraph = {
  nodes: ArangoDevice[];
  edges: ArangoEdge[];
};

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

  async function getInterfaceEdges(): Promise<ArangoEdge[]> {
    return db
      .query(
        aql`
        LET has = (FOR h IN Has RETURN h)
        
        RETURN has
    `,
      )
      .then((g) => g.all())
      .then((arr) => arr[0]);
  }

  async function getGraph(): Promise<ArangoGraph> {
    return db
      .query(
        aql`
      LET devices = (FOR d IN Device RETURN d)
      LET connected = (FOR c IN Connected RETURN c)
      
      RETURN { nodes: devices, edges: connected }
    `,
      )
      .then((g) => g.all())
      .then((arr) => arr[0]);
  }

  return {
    getCollections,
    getGraph,
    getInterfaceEdges,
  };
}

export function getArangoClient(): ArangoClient | undefined {
  if (!config.arangoEnabled) {
    return undefined;
  }

  return initClient();
}

export type ArangoClient = ReturnType<typeof initClient>;
