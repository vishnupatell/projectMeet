import { PrismaClient } from '@prisma/client';
import { config } from './index';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
