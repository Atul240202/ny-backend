/**
 * Multer Configuration
 * 
 * Handles file upload configuration for voice recordings.
 * Uses memory storage to upload directly to DigitalOcean Spaces.
 */

import multer from 'multer';

// Use memory storage for uploading to DigitalOcean Spaces
const storage = multer.memoryStorage();

// File filter - only accept audio files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/webm',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('Rejected file type:', file.mimetype);
    cb(new Error('Invalid file type. Only audio files are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
