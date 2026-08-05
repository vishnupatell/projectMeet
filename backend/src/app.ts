import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { isCorsOriginAllowed } from './utils/cors.util';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  credentials: config.cors.credentials,
  origin(origin, callback) {
    if (isCorsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));

// Rate limiting - Auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 requests per window (stricter for auth)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, try again later' } },
});
app.use('/api/auth', authLimiter);

// Rate limiting - General API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use('/api', apiLimiter);

// Rate limiting - File uploads (stricter)
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 10, // 10 uploads per 5 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Upload limit reached' } },
});
app.use('/api/files', uploadLimiter);
app.use('/api/recordings', uploadLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
}

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Error handler
app.use(errorHandler);

export default app;
