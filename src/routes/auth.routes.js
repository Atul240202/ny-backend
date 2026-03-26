/**
 * Authentication Routes
 *
 * Routes for Google OAuth authentication and user session management.
 */

import { Router } from 'express';
import { googleAuth, getMe, watchLogin, manualLogin, updateProfile } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/auth/google', googleAuth);
router.post('/auth/manual', manualLogin);
router.put('/auth/profile', authMiddleware, updateProfile);
router.post('/auth/watch', watchLogin);
router.get('/me', authMiddleware, getMe);

export default router;
