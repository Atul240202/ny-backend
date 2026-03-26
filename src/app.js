/**
 * @fileoverview Express Application Configuration
 * @description Configures Express app with middleware, routes, CORS, error handling,
 * and API endpoints for the Pause App backend.
 * @module app
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { logger } from './utils/logger.js';

import resetRoutes from './routes/resetRoutes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import userSettingsRoutes from './routes/userSettings.routes.js';
import appConstantRoutes from './routes/appConstant.routes.js';
import healthDataRoutes from './routes/healthData.routes.js';
import { checkHeartRateAndNotify } from './services/pushNotification.js';
import guardrailLogRoutes from './routes/guardrailLog.routes.js';
import { sendAlertToUser } from './services/pushNotification.js';

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || []
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.set('trust proxy', 1);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Pause App API',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/run-check', (req, res) => {
  checkHeartRateAndNotify();
  res.send('Heart rate check executed');
});

app.post('/api/v1/notify/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const alertData = req.body;
    await sendAlertToUser(userId, alertData);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error in notify endpoint:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', appConstantRoutes);
app.use('/api/v1/health-data', healthDataRoutes);
app.use('/api/v1/guardrail-logs', guardrailLogRoutes);
app.use('/api/v1/reset-sessions', resetRoutes);
app.use('/api/v1/user-settings', userSettingsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

app.use((err, req, res, _next) => {
  logger.error('Error:', err.stack);

  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
  });
});

export default app;
