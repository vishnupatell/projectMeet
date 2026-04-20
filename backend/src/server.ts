import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeSocketServer } from './sockets';
import prisma from './config/database';

const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketServer(httpServer);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

httpServer.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🔗 API: http://localhost:${config.port}/api`);
  logger.info(`❤️  Health: http://localhost:${config.port}/api/health`);
});
