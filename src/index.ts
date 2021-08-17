import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import express from 'express';
import config from './config';
import createContext from './context';
import getLogger from './get-logger';
import schema from './schema';
import syncZones from './sync-zones';

const log = getLogger('frinx-inventory-server');

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
const server = createServer(app);

let jobId: NodeJS.Timer;

async function runSyncZones() {
  syncZones().finally(() => {
    jobId = setTimeout(runSyncZones, 1000 * 60 * 2);
  });
}

// show startup message when server starts
server.on('listening', () => {
  // eslint-disable-next-line no-console
  log.info(`
    Server running on host ${config.host}
    Server running on port ${config.port}
  `);

  syncZones().finally(() => {
    jobId = setTimeout(runSyncZones, 1000 * 60 * 2);
  });
});

server.listen({
  host: config.host,
  port: config.port,
});

// when called, the server will stop handling new requests
// and when all existing requests finish it will exit the process
function close() {
  log.info('got signal to shut down, stopping accepting new connections');
  clearTimeout(jobId);
  if (server) {
    server.close(() => {
      log.info('all connections closed. exiting.');
      process.exit(0);
    });
  }
}

// SIGTERM is the please-shut-down signal sent by docker/kubernetes/kill-command
process.on('SIGTERM', close);

// SIGINT is sent when the user presses control-c in the console where node is running
process.on('SIGINT', close);
