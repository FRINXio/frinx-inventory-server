import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import fs from 'fs';
import { graphqlUploadExpress } from 'graphql-upload';
import { useServer } from 'graphql-ws/lib/use/ws';
import https from 'https';
import http, { Server } from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import createContext from './context';
import { UniconfigCache } from './external-api/uniconfig-cache';
import getLogger from './get-logger';
import isDev from './is-dev';
import schema from './schema';
import syncZones from './sync-zones';

export const log = getLogger('frinx-inventory-server');

// two minutes
const SYNC_ZONES_INTERVAL = 1000 * 60 * 2;
// ten minutes
const CACHE_CLEAR_INTERVAL = 1000 * 60 * 10;

process.on('unhandledRejection', (error) => {
  log.error(`Error: unhandled promise rejection: ${error}`);
});
process.on('uncaughtException', (error) => {
  log.error(`Error: uncaught exception: ${error}`);
});

const app = express();
app.use(graphqlUploadExpress());

const server = isDev
  ? https.createServer(
      {
        key: fs.readFileSync(path.resolve(process.cwd(), './server.key')),
        cert: fs.readFileSync(path.resolve(process.cwd(), './server.cert')),
      },
      app,
    )
  : http.createServer(app);

const wsServer = new WebSocketServer({
  server,
  path: '/graphql',
});
const serverCleanup = useServer({ schema }, wsServer);

const apolloServer = new ApolloServer({
  csrfPrevention: true,
  cache: 'bounded',
  context: createContext,
  schema,
  introspection: true,
  dataSources: () => ({}),
  logger: log,
  formatError: (err) => {
    log.error(err.message);
    return err;
  },
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer: server }),
    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

apolloServer.start().then(() => {
  apolloServer.applyMiddleware({
    app,
    path: '/graphql',
    bodyParserConfig: { limit: '50mb' },
    cors: { origin: '*', credentials: true },
  });
});

export function runSyncZones(serverInstance?: Server): void {
  let syncJobId: NodeJS.Timeout;

  syncZones().finally(() => {
    syncJobId = setTimeout(runSyncZones, SYNC_ZONES_INTERVAL);
  });

  serverInstance?.on('close', () => {
    clearTimeout(syncJobId);
  });
}

export function runCacheClear(serverInstance?: Server): void {
  const uniconfigCache = UniconfigCache.getInstance();
  log.info('clearing UniconfigCache');
  uniconfigCache.clear();
  const clearJobId = setTimeout(runCacheClear, CACHE_CLEAR_INTERVAL);

  serverInstance?.on('close', () => {
    clearTimeout(clearJobId);
  });
}

export { server };
