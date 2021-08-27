import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { createServer, Server } from 'http';
import createContext from './context';
import getLogger from './get-logger';
import schema from './schema';
import syncZones from './sync-zones';

export const log = getLogger('frinx-inventory-server');

process.on('unhandledRejection', (error) => {
  log.error(`Error: unhandled promise rejection: ${error?.toString()}`); // eslint-disable-line no-console
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
  let jobId: NodeJS.Timeout;

  syncZones().finally(() => {
    jobId = setTimeout(runSyncZones, 1000 * 60 * 2);
  });

  serverInstance.on('close', () => {
    clearTimeout(jobId);
  });
}
