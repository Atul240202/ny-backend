/**
 * Health Data Routes
 *
 * Routes for health data batch upload and retrieval
 */

import { Router } from 'express';
import { batchUploadHealthData, getUserHealthData } from '../controllers/healthData.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBatchUpload, validateGetHealthData } from '../validators/healthData.validator.js';

const router = Router();

router.post('/batch', validateBatchUpload, batchUploadHealthData);
router.get('/', authMiddleware, validateGetHealthData, getUserHealthData);

export default router;
