/**
 * DigitalOcean Spaces Configuration
 * 
 * S3-compatible client for uploading files to DigitalOcean Spaces.
 */

import { S3Client } from '@aws-sdk/client-s3';
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

// Validate DigitalOcean Spaces environment variables
const schema = Joi.object({
  DO_ACCESS_KEY: Joi.string().required(),
  DO_SECRET_KEY: Joi.string().required(),
  DO_BUCKET: Joi.string().required(),
  DO_ENDPOINT: Joi.string().uri().required(),
  DO_REGION: Joi.string().required(),
});

const { error, value } = schema.validate({
  DO_ACCESS_KEY: process.env.DO_ACCESS_KEY,
  DO_SECRET_KEY: process.env.DO_SECRET_KEY,
  DO_BUCKET: process.env.DO_BUCKET,
  DO_ENDPOINT: process.env.DO_ENDPOINT,
  DO_REGION: process.env.DO_REGION,
});

if (error) {
  throw new Error(`DigitalOcean Spaces configuration error: ${error.message}`);
}

export const s3 = new S3Client({
  endpoint: value.DO_ENDPOINT,
  region: 'us-east-1', // Always this for DigitalOcean
  credentials: {
    accessKeyId: value.DO_ACCESS_KEY,
    secretAccessKey: value.DO_SECRET_KEY,
  },
});

// Generate CDN URL dynamically
export const getCdnUrl = (key) => {
  return `https://${value.DO_BUCKET}.${value.DO_REGION}.cdn.digitaloceanspaces.com/${key}`;
};
