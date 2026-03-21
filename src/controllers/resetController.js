/**
 * Reset Session Controllers
 * Handles all reset session business logic including start, end, history, stats, and sync.
 * All endpoints require JWT authentication via authMiddleware.
 */

import ResetSession from '../models/ResetSession.js';
import { logger } from '../utils/logger.js';

export const startResetSession = async (req, res) => {
  try {
    const { deviceId, audioId, startedAt, triggerSource, selectedDurationMinutes, headphoneId, headphoneAction } = req.body;
    const userId = req.userId;

    const activeSession = await ResetSession.findOne({ userId, status: 'started' });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reset session',
        data: {
          activeSessionId: activeSession._id,
          startedAt: activeSession.startedAt,
        },
      });
    }

    const resetSession = await ResetSession.create({
      deviceId,
      audioId,
      userId,
      startedAt,
      triggerSource,
      selectedDurationMinutes,
      headphoneId,
      headphoneAction,
      status: 'started',
    });

    res.status(201).json({
      success: true,
      message: 'Reset session started successfully',
      data: {
        sessionId: resetSession._id,
        deviceId: resetSession.deviceId,
        audioId: resetSession.audioId,
        startedAt: resetSession.startedAt,
        selectedDurationMinutes: resetSession.selectedDurationMinutes,
        status: resetSession.status,
      },
    });
  } catch (error) {
    logger.error('Error starting reset session:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to start reset session',
    });
  }
};

export const endResetSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endedAt, status, endedBy, actualDurationSeconds } = req.body;
    const userId = req.userId;

    if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }

    const session = await ResetSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Reset session not found',
      });
    }

    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this session',
      });
    }

    if (session.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: 'This session has already ended',
      });
    }

    if (new Date(endedAt) <= session.startedAt) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const maxDuration = session.selectedDurationMinutes * 60 + 5;
    if (actualDurationSeconds > maxDuration) {
      return res.status(400).json({
        success: false,
        message: 'Actual duration cannot exceed selected duration',
      });
    }

    session.endedAt = endedAt;
    session.status = status;
    session.endedBy = endedBy;
    session.actualDurationSeconds = actualDurationSeconds;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Reset session ended successfully',
      data: {
        sessionId: session._id,
        status: session.status,
        endedBy: session.endedBy,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        selectedDurationMinutes: session.selectedDurationMinutes,
        actualDurationSeconds: session.actualDurationSeconds,
      },
    });
  } catch (error) {
    logger.error('Error ending reset session:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to end reset session',
    });
  }
};

export const getResetHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit, offset, status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const total = await ResetSession.countDocuments(query);

    const sessions = await ResetSession.find(query)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v -userId -createdAt -updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching reset history:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch reset history',
    });
  }
};

export const getResetStats = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await ResetSession.find({ userId })
      .select('status actualDurationSeconds headphoneAction startedAt')
      .lean();

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const interruptedSessions = sessions.filter(s => s.status === 'interrupted').length;

    const totalMinutesListened = sessions.reduce((sum, session) => {
      return sum + (session.actualDurationSeconds || 0) / 60;
    }, 0);

    const withHeadphones = sessions.filter(s => s.headphoneAction === 'connect').length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100 * 10) / 10 : 0;

    const lastSession = sessions.length > 0
      ? sessions.reduce((latest, session) =>
        new Date(session.startedAt) > new Date(latest.startedAt) ? session : latest,
      )
      : null;

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        interruptedSessions,
        completionRate,
        totalMinutesListened: Math.round(totalMinutesListened),
        averageSessionMinutes: totalSessions > 0 ? Math.round(totalMinutesListened / totalSessions) : 0,
        withHeadphones,
        withoutHeadphones: totalSessions - withHeadphones,
        lastReset: lastSession ? lastSession.startedAt : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching reset stats:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch reset statistics',
    });
  }
};

export const syncResetSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessions } = req.body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sessions array is required',
      });
    }

    const validatedSessions = sessions.filter(session => {
      return (
        session.deviceId &&
                session.audioId &&
                session.startedAt &&
                session.selectedDurationMinutes &&
                [7, 10, 15].includes(session.selectedDurationMinutes)
      );
    });

    if (validatedSessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid sessions to sync',
      });
    }

    const operations = validatedSessions.map(sessionData => {
      return {
        updateOne: {
          filter: {
            userId,
            startedAt: sessionData.startedAt,
          },
          update: {
            $set: {
              ...sessionData,
              userId,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await ResetSession.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Sync completed',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        totalProcessed: validatedSessions.length,
        skipped: sessions.length - validatedSessions.length,
      },
    });
  } catch (error) {
    logger.error('Error syncing reset sessions:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to sync reset sessions',
    });
  }
};
