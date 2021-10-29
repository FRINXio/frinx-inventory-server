import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { createServer, Server } from 'http';
import createContext from './context';
import { UniconfigCache } from './external-api/uniconfig-cache';
import getLogger from './get-logger';
import schema from './schema';
import syncZones from './sync-zones';

export const log = getLogger('frinx-inventory-server');

// two minutes
const SYNC_ZONES_INTERVAL = 1000 * 60 * 2;
// ten minutes
const CACHE_CLEAR_INTERVAL = 1000 * 60 * 10;

process.on('unhandledRejection', (error) => {
  log.error(`Error: unhandled promise rejection: ${error?.toString()}`);
});

const apolloServer = new ApolloServer({
  context: createContext,
  schema,
  introspection: true,
  dataSources: () => ({}),
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground({
      env: true,
    }),
  ],
});

const app = express();
apolloServer.start().then(() => {
  apolloServer.applyMiddleware({ app, path: '/graphql', bodyParserConfig: { limit: '50mb' } });
});
export const server = createServer(app);

export function runSyncZones(serverInstance: Server): void {
  let syncJobId: NodeJS.Timeout;

  syncZones().finally(() => {
    syncJobId = setTimeout(runSyncZones, SYNC_ZONES_INTERVAL);
  });

  serverInstance?.on('close', () => {
    clearTimeout(syncJobId);
  });
}

export function runCacheClear(serverInstance: Server): void {
  const uniconfigCache = UniconfigCache.getInstance();
  log.info('clearing UniconfigCache');
  uniconfigCache.clear();
  const clearJobId = setTimeout(runCacheClear, CACHE_CLEAR_INTERVAL);

  serverInstance?.on('close', () => {
    clearTimeout(clearJobId);
  });
}
