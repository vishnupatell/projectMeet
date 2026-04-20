import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });
  }
  return redis;
};

export const createRedisSubscriber = (): Redis => {
  const subscriber = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  subscriber.on('connect', () => {
    logger.info('Redis subscriber connected');
  });

  subscriber.on('error', (err) => {
    logger.error({ err }, 'Redis subscriber connection error');
  });

  return subscriber;
};

export default getRedisClient;
