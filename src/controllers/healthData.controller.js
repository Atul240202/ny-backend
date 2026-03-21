/**
 * Health Data Controller
 *
 * Handles batch upload and retrieval of health data from mobile devices and watches.
 *
 * Features:
 * - Batch upload with duplicate detection
 * - Source tracking (watch/phone)
 * - Pagination support for data retrieval
 * - Error handling and logging
 *
 * @module healthDataController
 */

import { logger } from '../utils/logger.js';
import HealthData from '../models/HealthData.js';

/**
 * Transform and sanitize health data entry
 *
 * Ensures consistent data format across watch → phone → MongoDB:
 * - user_id: Watch device ID (unique per device)
 * - timestamp: ISO 8601 UTC format
 * - rr_interval_ms: Heart rate RR interval
 * - accel_x, accel_y, accel_z: Accelerometer data
 * - step_count: Cumulative steps
 *
 * @param {Object} entry - Raw health data entry
 * @returns {Object} Transformed entry
 * @private
 */
const transformHealthEntry = (entry) => {
  return {
    user_id: String(entry.user_id),
    timestamp: String(entry.timestamp),
    rr_interval_ms: entry.rr_interval_ms !== null && entry.rr_interval_ms !== undefined ? Number(entry.rr_interval_ms) : 0,
    accel_x: entry.accel_x !== null && entry.accel_x !== undefined ? Number(entry.accel_x) : 0,
    accel_y: entry.accel_y !== null && entry.accel_y !== undefined ? Number(entry.accel_y) : 0,
    accel_z: entry.accel_z !== null && entry.accel_z !== undefined ? Number(entry.accel_z) : 0,
    step_count: entry.step_count !== null && entry.step_count !== undefined ? Number(entry.step_count) : 0,
  };
};

/**
 * Batch upload health data
 * Handles data from watch devices with automatic duplicate detection
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with upload status
 */
export const batchUploadHealthData = async (req, res) => {
  const { data } = req.body;

  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format - expected non-empty array',
      });
    }

    const watchUserId = data[0]?.user_id;

    logger.info('Watch data sync started', {
      user_id: watchUserId,
      records: data.length,
    });

    const healthEntries = data.map(entry => transformHealthEntry(entry));

    const result = await HealthData.insertMany(healthEntries, {
      ordered: false,
    });

    const insertedCount = Array.isArray(result) ? result.length : (result.insertedCount || 0);

    logger.info('Health data uploaded', {
      user_id: watchUserId,
      count: insertedCount,
      source: 'watch',
    });

    return res.status(201).json({
      success: true,
      message: 'Health data uploaded successfully',
      data: {
        inserted: insertedCount,
        user_id: watchUserId,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      const insertedCount = error.result?.nInserted || error.insertedDocs?.length || 0;
      const watchUserId = data[0]?.user_id;

      logger.warn('Duplicates skipped', {
        user_id: watchUserId,
        inserted: insertedCount,
        duplicates: data.length - insertedCount,
      });

      return res.status(201).json({
        success: true,
        message: 'Health data uploaded with duplicates skipped',
        data: {
          inserted: insertedCount,
          duplicates: data.length - insertedCount,
          user_id: watchUserId,
        },
      });
    }

    logger.error('Upload failed', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get user health data with pagination
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with health data and pagination
 */
export const getUserHealthData = async (req, res) => {
  const userId = req.userId;
  const { startDate, endDate, limit = 100, page = 1 } = req.query;

  try {
    const query = { userId };
    const limitValue = parseInt(limit);
    const pageValue = parseInt(page);

    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const skip = (pageValue - 1) * limitValue;

    const [entries, total] = await Promise.all([
      HealthData.find(query)
        .sort({ timestamp: -1 })
        .limit(limitValue)
        .skip(skip)
        .lean(),
      HealthData.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          total,
          page: pageValue,
          limit: limitValue,
          pages: Math.ceil(total / limitValue),
        },
      },
    });

  } catch (error) {
    logger.error('Get health data failed', { userId, error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
