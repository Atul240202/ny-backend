/**
 * Audio Session Routes
 * 
 * Routes for My Audio feature session logging
 */

import { Router } from 'express';
import { createAudioSession, getUserAudioSessions } from '../controllers/audioSession.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Create new audio session
router.post('/audio-sessions', authMiddleware, createAudioSession);

// Get user's audio sessions
router.get('/audio-sessions', authMiddleware, getUserAudioSessions);

export default router;
