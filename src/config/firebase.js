/**
 * @fileoverview Firebase Admin SDK Configuration
 * @description Initializes Firebase Admin SDK with support for both service account file
 * (development) and environment variables (production). Provides flexible configuration
 * for different deployment environments.
 * @module config/firebase
 */

import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    let credential;

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
      logger.info('Firebase initialized with environment variables');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
      logger.info('Firebase initialized with service account file via path');
    } else {
      try {
        const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        // Basic validation to check if it's a real key or just a template
        if (serviceAccount.private_key && serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
          credential = admin.credential.cert(serviceAccount);
          logger.info('Firebase initialized with local serviceAccountKey.json');
        } else {
          throw new Error('Local service account key is empty or invalid');
        }
      } catch (error) {
        logger.warn('Firebase credentials not found or invalid in environment variables or local file.');
        logger.warn('Push notifications and other Firebase services will not work.');
        return null;
      }
    }

    admin.initializeApp({
      credential,
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error.message);
    return null;
  }
};

export default admin;
