/**
 * @fileoverview Logger Utility
 * @description Centralized logging utility with environment-based control.
 * In production mode, only error messages are logged to reduce noise.
 * In development mode, all log levels (info, warn, debug, error) are active.
 * @module utils/logger
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};
