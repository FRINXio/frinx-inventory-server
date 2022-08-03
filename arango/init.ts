import { Database } from 'arangojs';
import { CollectionImportResult } from 'arangojs/collection';
import { readFileSync } from 'fs';

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
  const collectionNames = ['Connected', 'Device', 'Has', 'Interface'];
  const importCollectionsPromises = collectionNames.map((name) => importCollection(db, name));
  const importedCollections = await Promise.all(importCollectionsPromises);
  console.log(`Import result: `);
  collectionNames.map((name, i) => {
    console.log({ [name]: importedCollections[i] });
  });
}

async function importCollection(db: Database, collectionName: string): Promise<CollectionImportResult> {
  const data = readFileSync(`./arango/data/${collectionName}.json`).toString();
  const json = JSON.parse(data);

  // create new one and import data
  const newCollection = await db.createCollection(collectionName);
  const result = await newCollection.import(json);
  return result;
}

async function init() {
  const myDb = await initDatabase();
  await initCollections(myDb);
}

init();
