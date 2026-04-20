import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const parsedCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultCorsOrigins = ['http://localhost:3003', 'http://127.0.0.1:3003', 'https://liability-crispness-swaddling.ngrok-free.dev'];

export const config = {
  // Server
  port: Number.parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Database - just change this URL for AWS RDS / any managed DB
  databaseUrl: process.env.DATABASE_URL || 'postgresql://projectmeet:projectmeet_secret_2024@localhost:5432/projectmeet?schema=public',

  // Redis - change for AWS ElastiCache or managed Redis
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // CORS
  cors: {
    origin: parsedCorsOrigins.length > 0 ? parsedCorsOrigins : defaultCorsOrigins,
    credentials: true,
  },

  // WebRTC ICE Servers
  ice: {
    stunUrl: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
    turnUrl: process.env.TURN_SERVER_URL || 'turn:localhost:3478',
    turnUsername: process.env.TURN_USERNAME || 'projectmeet',
    turnPassword: process.env.TURN_PASSWORD || 'projectmeet_turn_2024',
  },
} as const;
