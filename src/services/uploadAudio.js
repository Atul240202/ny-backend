/**
 * Audio Upload Service
 * 
 * Handles uploading audio files to DigitalOcean Spaces.
 */

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, getCdnUrl } from '../config/s3.js';
import { logger } from '../utils/logger.js';

export const uploadAudioToSpaces = async (file) => {
  try {
    const key = `audio/${Date.now()}-${file.originalname}`;
    
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.DO_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
    );

    const url = getCdnUrl(key);
    
    logger.info('Audio uploaded to Spaces:', { key, url });
    
    return { url, key };
  } catch (error) {
    logger.error('Audio upload failed:', error);
    throw new Error('Failed to upload audio to storage');
  }
};
