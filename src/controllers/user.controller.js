/**
 * User Controller
 *
 * Handles user-related operations like profile updates and onboarding.
 */

import mongoose from 'mongoose';

import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import UserProfile from '../models/userProfile.js';
import { ONBOARDING_V1, ONBOARDING_VERSION } from '../constants/onboardingQuestions.js';

export const createUser = async (request, response) => {
  try {
    const { googleId, email, name, photoUrl } = request.body;

    if (!googleId || !email) {
      return response.status(400).json({
        success: false,
        message: 'googleId and email are required',
      });
    }

    const existingUser = await User.findOne({ googleId });

    if (existingUser) {
      return response.status(200).json({
        success: true,
        message: 'User already exists',
        data: {
          _id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          photoUrl: existingUser.photoUrl,
          onboardingCompleted: existingUser.onboardingCompleted,
        },
      });
    }

    const user = await User.create({
      googleId,
      email,
      name,
      photoUrl,
    });

    return response.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    logger.error('Create user error:', error);
    return response.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

export const updateOnboarding = async (req, res) => {
  try {
    if (!req.userId || !req.userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.onboardingCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    logger.error('Update onboarding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const completeOnboarding = async (req, res) => {
  const userId = req.userId;
  const { responses } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
    });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: 'Responses array is required',
    });
  }

  const requiredIds = ONBOARDING_V1;

  const receivedIds = responses.map(r => r.id);

  const allQuestionsAnswered = requiredIds.every(id =>
    receivedIds.includes(id),
  );

  if (!allQuestionsAnswered) {
    return res.status(400).json({
      success: false,
      message: 'All onboarding questions must be answered',
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await UserProfile.updateOne(
      { userId },
      {
        $set: {
          onboardingVersion: ONBOARDING_VERSION,
          responses: {
            values: responses,
          },
        },
      },
      { upsert: true },
    );

    user.onboardingCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
    });

  } catch (error) {
    logger.error('Complete onboarding failed', {
      userId,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
// Update FCM token for push notifications
export const updateFcmToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: 'FCM token updated',
      data: user,
    });

  } catch (error) {
    logger.error('Update FCM token error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
