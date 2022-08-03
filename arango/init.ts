import { Database } from 'arangojs';
import { CollectionType, CollectionImportResult } from 'arangojs/collection';
import { readFileSync } from 'fs';

const COLLECTION_DATA: { name: string; type: CollectionType }[] = [
  { name: 'Connected', type: CollectionType.EDGE_COLLECTION },
  { name: 'Device', type: CollectionType.DOCUMENT_COLLECTION },
  { name: 'Has', type: CollectionType.EDGE_COLLECTION },
  { name: 'Interface', type: CollectionType.DOCUMENT_COLLECTION },
];

const db = new Database({
  auth: {
    username: 'root',
    password: 'frinx',
  },
});

async function initDatabase() {
  let myDb = db.database('lldp');
  if (await myDb.exists()) {
    db.dropDatabase('lldp');
  }

  const newDb = await db.createDatabase('lldp');
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

  // create new one and import data
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
