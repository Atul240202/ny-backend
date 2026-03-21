/**
 * @fileoverview Environment Variables Validator
 * @description Validates required environment variables before server startup.
 * Checks for MongoDB URI, JWT secret, Firebase credentials, and other required configuration.
 * Exits process if critical variables are missing or invalid.
 * @module utils/validateEnv
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
];

const firebaseEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
];

export const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  const hasFirebaseFile = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasFirebaseEnvVars = firebaseEnvVars.every((varName) => process.env[varName]);

  if (!hasFirebaseFile && !hasFirebaseEnvVars) {
    console.warn('Warning: Firebase credentials not configured. Either set FIREBASE_SERVICE_ACCOUNT_PATH or provide FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL');
  }

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  console.log('Environment variables validated successfully');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  import('dotenv').then((dotenv) => {
    dotenv.config();
    validateEnv();
  });
}
