import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import config from './config';
import createContext from './context';
import getLogger from './get-logger';
import schema from './schema';

const log = getLogger('frinx-inventory-server');

const apolloServer = new ApolloServer({
  context: createContext,
  schema,
});

const app = express();
apolloServer.applyMiddleware({ app, path: '/graphql' });

app.listen(
  {
    host: config.host,
    port: config.port,
  },
  () => {
    log.info(`
    Server running on host ${config.host}
    Server running on port ${config.port}
  `);
  },
);
