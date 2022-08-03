import { Database } from 'arangojs';
import { CollectionImportResult } from 'arangojs/collection';
import { readFileSync } from 'fs';

const db = new Database();
const myDb = db.database('lldp');

async function importCollection(collectionName: string): Promise<CollectionImportResult> {
  const data = readFileSync(`./arango/data/${collectionName}.json`).toString();
  const json = JSON.parse(data);

  // drop existing collection
  const collection = myDb.collection(collectionName);
  const isExistingCollection = await collection.exists();
  if (isExistingCollection) {
    await collection.drop();
  }

  // create new one and import data
  const newCollection = await myDb.createCollection(collectionName);
  const result = await newCollection.import(json);
  return result;
}

async function initDatabase(): Promise<void> {
  const collectionNames = ['Connected', 'Device', 'Has', 'Interface'];
  const importCollectionsPromises = collectionNames.map(importCollection);
  const importedCollections = await Promise.all(importCollectionsPromises);
  console.log(`Import result: `);
  collectionNames.map((name, i) => {
    console.log({ [name]: importedCollections[i] });
  });
}

initDatabase();
