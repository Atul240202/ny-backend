/**
 * Reset Session Routes
 * Defines all HTTP routes for reset session management.
 * Base path: /api/v1/reset-sessions - All routes require authentication.
 */

import express from 'express';
import {
  startResetSession,
  endResetSession,
  getResetHistory,
  getResetStats,
  syncResetSessions,
} from '../controllers/resetController.js';
import {
  validateStartReset,
  validateEndReset,
  validateHistoryQuery,
} from '../validators/resetValidator.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, validateStartReset, startResetSession);

router.put('/:sessionId', authMiddleware, validateEndReset, endResetSession);

router.get('/', authMiddleware, validateHistoryQuery, getResetHistory);

router.get('/stats', authMiddleware, getResetStats);

router.post('/sync', authMiddleware, syncResetSessions);

export default router;
