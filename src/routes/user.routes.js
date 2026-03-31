/**
 * User Routes
 *
 * Routes for user profile management and onboarding.
 */
import {Router} from 'express';
import { createUser, updateOnboarding, completeOnboarding, updateFcmToken, restartOnboarding} from '../controllers/user.controller.js';
import { createUserProfile } from '../controllers/userProfile.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/users', createUser);
router.put('/users/onboarding', authMiddleware, updateOnboarding);
router.post('/user-profiles', authMiddleware, createUserProfile);
router.post('/onboarding/complete', 
  (req, res, next) => {
    console.log('=== ROUTE HIT: /onboarding/complete ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    next();
  },
  authMiddleware, 
  upload.single('voiceRecording'), 
  completeOnboarding
);
router.post('/onboarding/restart', authMiddleware, restartOnboarding);
router.post('/users/fcm-token', authMiddleware, updateFcmToken);

export default router;
