import { PrismaClient } from '@prisma/client';
import config from './config';

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: config.dbURL,
    },
  },
});

export default prismaClient;
