/**
 * Health Data Routes
 *
 * Routes for health data batch upload and retrieval
 */

import { Router } from 'express';
import {
  batchUploadHealthData,
  getUserHealthData,
  getHealthDataWithIST,
  getTimestampStats,
} from '../controllers/healthData.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBatchUpload, validateGetHealthData } from '../validators/healthData.validator.js';

const router = Router();

router.post('/batch', authMiddleware, validateBatchUpload, batchUploadHealthData);
router.get('/', authMiddleware, validateGetHealthData, getUserHealthData);

/* New routes for timestamp analysis */
router.get('/timestamps/ist', getHealthDataWithIST);
router.get('/timestamps/stats', getTimestampStats);

export default router;
