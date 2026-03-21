import UserProfile from '../models/userProfile.js';
import { logger } from '../utils/logger.js';

// POST /user-profiles
export const createUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { responses, onboardingVersion } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Responses array is required',
      });
    }

    const existingProfile = await UserProfile.findOne({ userId });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'User profile already exists',
      });
    }

    const profile = await UserProfile.create({
      userId,
      onboardingVersion,
      responses,
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: profile._id,
        onboardingVersion: profile.onboardingVersion,
        responses: profile.responses,
      },
    });

  } catch (error) {
    logger.error('Create user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
