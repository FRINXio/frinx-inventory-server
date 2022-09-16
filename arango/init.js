'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const arangojs_1 = require('arangojs');
const collection_1 = require('arangojs/collection');
const fs_1 = require('fs');
const { ARANGO_DB, ARANGO_USER, ARANGO_PASSWORD } = process.env;
if (!ARANGO_DB || !ARANGO_USER || !ARANGO_PASSWORD) {
  throw new Error('Please set all mandatory arango .env variables');
}
const config = {
  user: ARANGO_USER,
  password: ARANGO_PASSWORD,
  databaseName: ARANGO_DB,
};
const COLLECTION_DATA = [
  { name: 'Connected', type: collection_1.CollectionType.EDGE_COLLECTION },
  { name: 'Device', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
  { name: 'Has', type: collection_1.CollectionType.EDGE_COLLECTION },
  { name: 'Interface', type: collection_1.CollectionType.DOCUMENT_COLLECTION },
];
const db = new arangojs_1.Database({
  auth: {
    username: config.user,
    password: config.password,
  },
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
async function initCollections(db) {
  const importCollectionsPromises = COLLECTION_DATA.map(({ name, type }) => importCollection(db, name, type));
  const importedCollections = await Promise.all(importCollectionsPromises);
  console.log(`Import result: `);
  COLLECTION_DATA.forEach(({ name }, i) => {
    console.log({ [name]: importedCollections[i] });
  });
}
async function importCollection(db, name, type) {
  const data = (0, fs_1.readFileSync)(`./arango/data/${name}.json`).toString();
  const json = JSON.parse(data);
  const newCollection =
    type === collection_1.CollectionType.DOCUMENT_COLLECTION
      ? await db.createCollection(name)
      : await db.createEdgeCollection(name);
  const result = await newCollection.import(json);
  return result;
}
async function init() {
  const myDb = await initDatabase();
  await initCollections(myDb);
}
init();
