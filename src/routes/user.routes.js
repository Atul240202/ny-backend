/**
 * User Routes
 *
 * Routes for user profile management and onboarding.
 */
import {Router} from 'express';
import { createUser, updateOnboarding, completeOnboarding, updateFcmToken } from '../controllers/user.controller.js';
import { createUserProfile } from '../controllers/userProfile.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/users', createUser);
router.put('/users/onboarding', authMiddleware, updateOnboarding);
router.post('/user-profiles', authMiddleware, createUserProfile);
router.post('/onboarding/complete', authMiddleware, completeOnboarding);
router.post('/users/fcm-token', authMiddleware, updateFcmToken);

export default router;
