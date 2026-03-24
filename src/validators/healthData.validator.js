/**
 * Health Data Validation Schemas
 *
 * Joi validation schemas for health data endpoints
 *
 * Validates consistent data format:
 * - user_id: Watch device ID (required)
 * - timestamp: ISO 8601 UTC format (required)
 * - rr_interval_ms: Heart rate RR interval
 * - accel_x, accel_y, accel_z: Accelerometer data
 * - step_count: Cumulative steps
 */

import Joi from 'joi';

export const batchUploadSchema = Joi.object({
  data: Joi.array()
    .items(
      Joi.object({
        user_id: Joi.string().required(),
        timestamp: Joi.string().required(),
        rr_interval_ms: Joi.number().allow(null).optional().default(0),
        accel_x: Joi.number().allow(null).optional().default(0),
        accel_y: Joi.number().allow(null).optional().default(0),
        accel_z: Joi.number().allow(null).optional().default(0),
        step_count: Joi.number().integer().min(0).allow(null).optional().default(0),
        /* IST formatted timestamp fields */
        sensor_datetime_ist: Joi.string().allow(null).optional(),
        watch_data_send_datetime_ist: Joi.string().allow(null).optional(),
        mobile_receive_datetime_ist: Joi.string().allow(null).optional(),
        mobile_send_datetime_ist: Joi.string().allow(null).optional(),
        /* Unix timestamps for backward compatibility (will be converted to IST) */
        sensor_datetime: Joi.number().allow(null).optional(),
        watch_data_send_datetime: Joi.number().allow(null).optional(),
        mobile_receive_datetime: Joi.number().allow(null).optional(),
        mobile_send_datetime: Joi.number().allow(null).optional(),
        mobile_receive_error_code: Joi.string()
          .allow(null)
          .valid(
            null,
            'WATCH_DISCONNECTED',
            'PUSH_TIMEOUT',
            'PULL_BACKUP',
            'NETWORK_ERROR',
            'AUTH_ERROR',
            'VALIDATION_ERROR',
            'SERVER_ERROR',
            'MONGODB_SYNC_FAILED',
            'UNKNOWN_ERROR',
          )
          .optional()
          .default(null),
        data_source: Joi.string()
          .valid('PUSH', 'PULL', 'UNKNOWN')
          .optional()
          .default('PUSH'),
      }).unknown(false),
    )
    .min(1)
    .max(1000)
    .required(),
});

export const getHealthDataSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  page: Joi.number().integer().min(1).optional(),
});

export const validateBatchUpload = (req, res, next) => {
  const { error } = batchUploadSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

export const validateGetHealthData = (req, res, next) => {
  const { error } = getHealthDataSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};
