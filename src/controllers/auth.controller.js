/**
 * Authentication Controller
 *
 * Handles Google OAuth authentication and JWT token generation.
 */

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export const googleAuth = async (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    if (!GOOGLE_CLIENT_ID) {
      logger.error('GOOGLE_WEB_CLIENT_ID is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    if (!JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken is required',
      });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const photoUrl = payload.picture;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        photoUrl,
        authProvider: 'google',
        onboardingCompleted: false,
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          photoUrl: user.photoUrl,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.userId || !req.userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await User.findById(req.userId).select('_id email name photoUrl onboardingCompleted');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    logger.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const watchLogin = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    const { email, password } = req.body;

    if (!JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // For watch testing - create or find user by email
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: email.split('@')[0],
        googleId: `watch_${Date.now()}`,
        onboardingCompleted: true,
      });
      logger.info('Watch user created:', { email, userId: user._id });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    logger.error('Watch login error:', error);
    return res.status(401).json({
      success: false,
      message: 'Watch authentication failed',
    });
  }
};

export const manualLogin = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    const { name, age, phoneNumber, city, country, gender } = req.body;

    if (!JWT_SECRET) {
      logger.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    if (!name || !age || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and phone number are required',
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return res.status(400).json({
        success: false,
        message: 'Invalid age',
      });
    }

    // Create email from phone number for uniqueness
    const email = `${phoneNumber}@pause.app`;

    // Use findOneAndUpdate with upsert to prevent race condition
    const user = await User.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          name,
          age: ageNum,
          email,
          city,
          country,
          gender,
        },
        $setOnInsert: {
          phoneNumber,
          authProvider: 'manual',
          onboardingCompleted: false,
        },
      },
      { upsert: true, new: true }
    );

    logger.info('Manual user login/created:', { name, phoneNumber, userId: user._id });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          photoUrl: user.photoUrl,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (error) {
    logger.error('Manual login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Manual authentication failed',
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, age, phoneNumber, city, country, gender } = req.body;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (!name || !age || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and phone number are required',
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return res.status(400).json({
        success: false,
        message: 'Invalid age',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user profile
    user.name = name;
    user.age = ageNum;
    user.phoneNumber = phoneNumber;
    user.city = city;
    user.country = country;
    user.gender = gender;

    await user.save();

    logger.info('User profile updated:', { userId, name, phoneNumber });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};
