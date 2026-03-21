/**
 * Authentication Routes
 *
 * Routes for Google OAuth authentication and user session management.
 */

import { Router } from 'express';
import { googleAuth, getMe, watchLogin } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/auth/google', googleAuth);
router.post('/auth/watch', watchLogin);
router.get('/me', authMiddleware, getMe);

export default router;
