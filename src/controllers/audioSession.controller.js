/**
 * Audio Session Controller
 * 
 * Handles My Audio session logging
 */

import AudioSession from '../models/AudioSession.js';
import { logger } from '../utils/logger.js';

export const createAudioSession = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      session_id,
      audio_id,
      audio_file_name,
      audio_display_name,
      session_start,
      session_end,
      play_duration_seconds,
      bluetooth_verified = true,
    } = req.body;

    // Validate required fields
    if (!session_id || !audio_id || !audio_file_name || !audio_display_name || 
        !session_start || !session_end || play_duration_seconds === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create audio session
    const audioSession = await AudioSession.create({
      session_id,
      user_id: userId,
      audio_id,
      audio_file_name,
      audio_display_name,
      session_start: new Date(session_start),
      session_end: new Date(session_end),
      play_duration_seconds,
      bluetooth_verified,
    });

    logger.info('Audio session created:', {
      session_id,
      user_id: userId,
      audio_id,
      duration: play_duration_seconds,
    });

    return res.status(201).json({
      success: true,
      message: 'Audio session saved successfully',
      data: audioSession,
    });

  } catch (error) {
    logger.error('Create audio session error:', error);
    
    // Handle duplicate session_id
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Session already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

export const getUserAudioSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    const sessions = await AudioSession.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AudioSession.countDocuments({ user_id: userId });

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });

  } catch (error) {
    logger.error('Get user audio sessions error:', error);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
