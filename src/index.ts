import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
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
const corsOptions = {
  origin: new RegExp('/*/'),
  credentials: true,
};
app.use(cors(corsOptions));
apolloServer.applyMiddleware({ app, path: '/graphql', cors: false });

app.on('listening', () => {
  log.info(`
    Server running on host ${config.host}
    Server running on port ${config.port}
  `);
});

app.listen({
  host: config.host,
  port: config.port,
});
