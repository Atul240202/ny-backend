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

    logger.info('Google auth request received', { hasIdToken: !!idToken });

    if (!idToken) {
      logger.warn('Google auth failed: idToken is missing');
      return res.status(400).json({
        success: false,
        message: 'idToken is required',
      });
    }

    logger.debug('Verifying Google ID token...');

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      logger.warn('Google auth failed: Invalid token payload');
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    logger.info('Google token verified successfully', { email: payload.email });

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
        onboardingCompleted: false,
      });
      logger.info('New user created via Google Auth', { userId: user._id, email: user.email });
    } else {
      logger.info('Existing user logged in via Google Auth', { userId: user._id, email: user.email });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    logger.debug('Google Auth successful, returning token');

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
