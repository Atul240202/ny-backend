/**
 * User Controller
 *
 * Handles user-related operations like profile updates and onboarding.
 */

import mongoose from 'mongoose';

import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import UserProfile from '../models/UserProfile.js';
import { ONBOARDING_V1, ONBOARDING_VERSION } from '../constants/onboardingQuestions.js';
import { uploadAudioToSpaces } from '../services/uploadAudio.js';

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
  console.log('=== NEW CODE VERSION 2.0 - COMPLETE ONBOARDING CALLED ===');
  try {
    const userId = req.userId;
    const voiceRecording = req.file;

    console.log('Complete onboarding called');
    console.log('User ID:', userId);
    console.log('Voice recording file:', voiceRecording);
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'body is null/undefined');

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('req.body is undefined or empty');
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or invalid',
      });
    }

    // Parse responses - it comes as a JSON string from FormData
    let parsedResponses;
    if (!req.body.responses) {
      console.error('req.body.responses is undefined');
      return res.status(400).json({
        success: false,
        message: 'Responses are required',
      });
    }
    
    console.log('Responses value:', req.body.responses);
    console.log('Responses type:', typeof req.body.responses);
    
    try {
      parsedResponses = typeof req.body.responses === 'string' 
        ? JSON.parse(req.body.responses) 
        : req.body.responses;
    } catch (parseError) {
      console.error('Failed to parse responses:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid responses format',
      });
    }

    if (!parsedResponses || !Array.isArray(parsedResponses)) {
      return res.status(400).json({
        success: false,
        message: 'Responses array is required',
      });
    }

    const requiredIds = ONBOARDING_V1;
    const receivedIds = parsedResponses.filter(r => r && r.id).map(r => r.id);
    const allQuestionsAnswered = requiredIds.every(id => receivedIds.includes(id));

    if (!allQuestionsAnswered) {
      return res.status(400).json({
        success: false,
        message: 'All onboarding questions must be answered',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prepare profile data
    const profileData = {
      onboardingVersion: ONBOARDING_VERSION,
      responses: {
        values: parsedResponses,
      },
    };

    // Upload voice recording to DigitalOcean Spaces if file was provided
    if (voiceRecording) {
      try {
        console.log('Attempting to upload voice recording...');
        const { url, key } = await uploadAudioToSpaces(voiceRecording);
        profileData.voiceRecordingUrl = url;
        profileData.voiceRecordingKey = key;
        logger.info('Voice recording uploaded to Spaces:', {
          userId,
          key,
          url,
        });
        console.log('Voice recording uploaded successfully');
      } catch (uploadError) {
        console.error('Voice recording upload failed:', uploadError);
        logger.error('Voice recording upload failed:', uploadError);
        // Continue with onboarding even if upload fails - don't block the user
      }
    } else {
      console.log('No voice recording file provided');
    }

    await UserProfile.updateOne(
      { userId },
      { $set: profileData },
      { upsert: true },
    );

    user.onboardingCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    logger.error('Complete onboarding failed', {
      userId: req.userId,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
// Restart onboarding - reset onboarding status
export const restartOnboarding = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.onboardingCompleted = false;
    await user.save();

    // Optionally delete the user profile to reset all onboarding data
    await UserProfile.deleteOne({ userId });

    return res.status(200).json({
      success: true,
      message: 'Onboarding restarted successfully',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });

  } catch (error) {
    logger.error('Restart onboarding error:', error);

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
