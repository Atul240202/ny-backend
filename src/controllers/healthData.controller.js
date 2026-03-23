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
    /* Timestamp fields */
    sensor_datetime: entry.sensor_datetime !== null && entry.sensor_datetime !== undefined ? Number(entry.sensor_datetime) : 0,
    watch_data_send_datetime: entry.watch_data_send_datetime !== null && entry.watch_data_send_datetime !== undefined ? Number(entry.watch_data_send_datetime) : 0,
    mobile_receive_datetime: entry.mobile_receive_datetime !== null && entry.mobile_receive_datetime !== undefined ? Number(entry.mobile_receive_datetime) : 0,
    mobile_send_datetime: entry.mobile_send_datetime !== null && entry.mobile_send_datetime !== undefined ? Number(entry.mobile_send_datetime) : 0,
    mobile_receive_error_code: entry.mobile_receive_error_code || null,
    data_source: entry.data_source || 'PUSH',
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


/**
 * Get health data with timestamps in IST
 * Displays all timestamp fields converted to Indian Standard Time
 *
 * Query Parameters:
 * - user_id: Filter by user ID (optional)
 * - limit: Number of records (default: 50, max: 500)
 * - page: Page number (default: 1)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with health data in IST
 */
export const getHealthDataWithIST = async (req, res) => {
  try {
    const { user_id, limit = 50, page = 1 } = req.query;

    const limitValue = Math.min(parseInt(limit, 10) || 50, 500);
    const pageValue = parseInt(page, 10) || 1;
    const skip = (pageValue - 1) * limitValue;

    const query = {};
    if (user_id) {
      query.user_id = user_id;
    }

    /* Get data with timestamp fields */
    const data = await HealthData.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitValue)
      .lean();

    const total = await HealthData.countDocuments(query);

    /* Convert timestamps to IST */
    const dataWithIST = data.map(record => {
      const convertToIST = (unixTimestamp) => {
        if (!unixTimestamp || unixTimestamp === 0) return null;

        const date = new Date(unixTimestamp);
        return date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      };

      /* Calculate delays in seconds */
      const calculateDelay = (end, start) => {
        if (!end || !start || end === 0 || start === 0) return null;
        return ((end - start) / 1000).toFixed(2);
      };

      return {
        _id: record._id,
        user_id: record.user_id,
        timestamp: record.timestamp,

        /* Sensor data */
        rr_interval_ms: record.rr_interval_ms,
        accel_x: record.accel_x,
        accel_y: record.accel_y,
        accel_z: record.accel_z,
        step_count: record.step_count,

        /* Timestamps in IST */
        sensor_datetime_ist: convertToIST(record.sensor_datetime),
        watch_data_send_datetime_ist: convertToIST(record.watch_data_send_datetime),
        mobile_receive_datetime_ist: convertToIST(record.mobile_receive_datetime),
        mobile_send_datetime_ist: convertToIST(record.mobile_send_datetime),

        /* Original Unix timestamps (for reference) */
        sensor_datetime_unix: record.sensor_datetime,
        watch_data_send_datetime_unix: record.watch_data_send_datetime,
        mobile_receive_datetime_unix: record.mobile_receive_datetime,
        mobile_send_datetime_unix: record.mobile_send_datetime,

        /* Delay analysis (in seconds) */
        delays: {
          sensor_to_watch_send: calculateDelay(record.watch_data_send_datetime, record.sensor_datetime),
          watch_send_to_mobile_receive: calculateDelay(record.mobile_receive_datetime, record.watch_data_send_datetime),
          mobile_receive_to_send: calculateDelay(record.mobile_send_datetime, record.mobile_receive_datetime),
          total_end_to_end: calculateDelay(record.mobile_send_datetime, record.sensor_datetime),
        },

        /* Error tracking */
        mobile_receive_error_code: record.mobile_receive_error_code,

        /* MongoDB timestamps */
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    logger.info('Health data with IST retrieved', {
      count: dataWithIST.length,
      total,
      user_id: user_id || 'all',
    });

    return res.status(200).json({
      success: true,
      message: 'Health data retrieved successfully',
      data: dataWithIST,
      pagination: {
        total,
        page: pageValue,
        limit: limitValue,
        pages: Math.ceil(total / limitValue),
      },
    });

  } catch (error) {
    logger.error('Get health data with IST failed', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get timestamp delay statistics in IST
 * Provides average, min, max delays for each stage
 *
 * Query Parameters:
 * - user_id: Filter by user ID (optional)
 * - startDate: Start date filter (optional)
 * - endDate: End date filter (optional)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with delay statistics
 */
export const getTimestampStats = async (req, res) => {
  try {
    const { user_id, startDate, endDate } = req.query;

    const matchStage = {
      sensor_datetime: { $gt: 0 },
      watch_data_send_datetime: { $gt: 0 },
      mobile_receive_datetime: { $gt: 0 },
      mobile_send_datetime: { $gt: 0 },
    };

    if (user_id) {
      matchStage.user_id = user_id;
    }

    if (startDate) {
      matchStage.createdAt = { $gte: new Date(startDate) };
    }

    if (endDate) {
      matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(endDate) };
    }

    const stats = await HealthData.aggregate([
      { $match: matchStage },
      {
        $project: {
          sensor_to_watch_delay: {
            $divide: [
              { $subtract: ['$watch_data_send_datetime', '$sensor_datetime'] },
              1000,
            ],
          },
          watch_to_mobile_delay: {
            $divide: [
              { $subtract: ['$mobile_receive_datetime', '$watch_data_send_datetime'] },
              1000,
            ],
          },
          mobile_processing_delay: {
            $divide: [
              { $subtract: ['$mobile_send_datetime', '$mobile_receive_datetime'] },
              1000,
            ],
          },
          total_delay: {
            $divide: [
              { $subtract: ['$mobile_send_datetime', '$sensor_datetime'] },
              1000,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,

          /* Sensor to Watch Send */
          avg_sensor_to_watch: { $avg: '$sensor_to_watch_delay' },
          min_sensor_to_watch: { $min: '$sensor_to_watch_delay' },
          max_sensor_to_watch: { $max: '$sensor_to_watch_delay' },

          /* Watch to Mobile */
          avg_watch_to_mobile: { $avg: '$watch_to_mobile_delay' },
          min_watch_to_mobile: { $min: '$watch_to_mobile_delay' },
          max_watch_to_mobile: { $max: '$watch_to_mobile_delay' },

          /* Mobile Processing */
          avg_mobile_processing: { $avg: '$mobile_processing_delay' },
          min_mobile_processing: { $min: '$mobile_processing_delay' },
          max_mobile_processing: { $max: '$mobile_processing_delay' },

          /* Total End-to-End */
          avg_total: { $avg: '$total_delay' },
          min_total: { $min: '$total_delay' },
          max_total: { $max: '$total_delay' },

          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No data available for statistics',
        data: null,
      });
    }

    const result = stats[0];

    logger.info('Timestamp statistics retrieved', {
      count: result.count,
      user_id: user_id || 'all',
    });

    return res.status(200).json({
      success: true,
      message: 'Timestamp statistics retrieved successfully',
      data: {
        total_records: result.count,
        delays_in_seconds: {
          sensor_to_watch_send: {
            average: parseFloat(result.avg_sensor_to_watch?.toFixed(2) || 0),
            minimum: parseFloat(result.min_sensor_to_watch?.toFixed(2) || 0),
            maximum: parseFloat(result.max_sensor_to_watch?.toFixed(2) || 0),
            description: 'Time from sensor capture to watch sending data',
          },
          watch_to_mobile_bluetooth: {
            average: parseFloat(result.avg_watch_to_mobile?.toFixed(2) || 0),
            minimum: parseFloat(result.min_watch_to_mobile?.toFixed(2) || 0),
            maximum: parseFloat(result.max_watch_to_mobile?.toFixed(2) || 0),
            description: 'Bluetooth transfer time from watch to phone',
          },
          mobile_processing: {
            average: parseFloat(result.avg_mobile_processing?.toFixed(2) || 0),
            minimum: parseFloat(result.min_mobile_processing?.toFixed(2) || 0),
            maximum: parseFloat(result.max_mobile_processing?.toFixed(2) || 0),
            description: 'Time from phone receiving to sending to MongoDB',
          },
          total_end_to_end: {
            average: parseFloat(result.avg_total?.toFixed(2) || 0),
            minimum: parseFloat(result.min_total?.toFixed(2) || 0),
            maximum: parseFloat(result.max_total?.toFixed(2) || 0),
            description: 'Total time from sensor to MongoDB',
          },
        },
      },
    });

  } catch (error) {
    logger.error('Get timestamp stats failed', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
