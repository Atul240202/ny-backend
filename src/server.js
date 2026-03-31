/**
 * @fileoverview Server Entry Point
 * @description Initializes and starts the Express HTTP server with MongoDB connection,
 * Firebase Admin SDK, environment validation, and graceful shutdown handling.
 * @module server
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/database.js';
import { logger } from './utils/logger.js';
import { validateEnv } from './utils/validateEnv.js';
import { initializeFirebase } from './config/firebase.js';

const PORT = process.env.PORT || 5001;

validateEnv();
initializeFirebase();

// Start server after attempting DB connection
(async () => {
  await connectDB();
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    logger.info(`Server running on http://0.0.0.0:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
