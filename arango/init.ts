import { Database } from 'arangojs';
import { CollectionType, CollectionImportResult } from 'arangojs/collection';
import { readFileSync } from 'fs';

const { ARANGO_URL, ARANGO_DB, ARANGO_USER, ARANGO_PASSWORD, ARANGO_TOKEN } = process.env;

if (!ARANGO_URL || !ARANGO_DB || !ARANGO_USER || !ARANGO_PASSWORD) {
  throw new Error('Please set all mandatory arango .env variables');
}

const config = {
  url: ARANGO_URL,
  user: ARANGO_USER,
  password: ARANGO_PASSWORD,
  databaseName: ARANGO_DB,
  token: ARANGO_TOKEN || null,
};

const COLLECTION_DATA: { name: string; type: CollectionType }[] = [
  { name: 'Connected', type: CollectionType.EDGE_COLLECTION },
  { name: 'Device', type: CollectionType.DOCUMENT_COLLECTION },
  { name: 'Has', type: CollectionType.EDGE_COLLECTION },
  { name: 'Interface', type: CollectionType.DOCUMENT_COLLECTION },
];

const auth = config.token ? { token: config.token } : { username: config.user, password: config.password };

const db = new Database({
  url: config.url,
  auth,
});

async function initDatabase() {
  const { databaseName } = config;
  let myDb = db.database(databaseName);
  if (await myDb.exists()) {
    db.dropDatabase(databaseName);
  }

  const newDb = await db.createDatabase(databaseName);
  return newDb;
}

async function initCollections(db: Database): Promise<void> {
  const importCollectionsPromises = COLLECTION_DATA.map(({ name, type }) => importCollection(db, name, type));
  const importedCollections = await Promise.all(importCollectionsPromises);
  console.log(`Import result: `);
  COLLECTION_DATA.forEach(({ name }, i) => {
    console.log({ [name]: importedCollections[i] });
  });
}

async function importCollection(db: Database, name: string, type: CollectionType): Promise<CollectionImportResult> {
  const data = readFileSync(`./arango/data/${name}.json`).toString();
  const json = JSON.parse(data);

  const newCollection =
    type === CollectionType.DOCUMENT_COLLECTION ? await db.createCollection(name) : await db.createEdgeCollection(name);
  const result = await newCollection.import(json);
  return result;
}

async function init() {
  const myDb = await initDatabase();
  await initCollections(myDb);
}

init();
