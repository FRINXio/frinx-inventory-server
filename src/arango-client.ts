import { aql, Database } from 'arangojs';
import { CollectionMetadata } from 'arangojs/collection';
import { ArangoError } from 'arangojs/error';
import config from './config';
import CustomArangoError from './custom-arango-error';

export type ArangoDevice = {
  _key: string;
  _id: string;
  // _rev: string;
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
    if (config.topologyEnabled === false) {
      throw new Error('Arango connection should be defined in .env file');
    }

    const auth = config.arangoToken
      ? { token: config.arangoToken }
      : { username: config.arangoUser, password: config.arangoPassword };

    this.db = new Database({
      url: config.arangoURL,
      databaseName: config.arangoDb,
      auth,
    });
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
        LET has = (FOR h IN phy_has RETURN h)
        
        RETURN has
    `,
      )
      .then((g) => g.all())
      .then((arr) => arr[0])
      .catch((e: ArangoError) => {
        throw new CustomArangoError(e.message, e.code);
      });
  }

  async function getGraph(): Promise<ArangoGraph> {
    return db
      .query(
        aql`
      LET devices = (FOR d IN phy_device RETURN d)
      LET connected = (FOR c IN phy_link RETURN c)
      
      RETURN { nodes: devices, edges: connected }
    `,
      )
      .then((g) => g.all())
      .then((arr) => arr[0])
      .catch((e: ArangoError) => {
        throw new CustomArangoError(e.message, e.code);
      });
  }

  return {
    getCollections,
    getGraph,
    getInterfaceEdges,
  };
}

export function getArangoClient(): ArangoClient | undefined {
  if (!config.topologyEnabled) {
    return undefined;
  }

  return initClient();
}

export type ArangoClient = ReturnType<typeof initClient>;
