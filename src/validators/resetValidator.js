/**
 * Request Validation Schemas
 * Validates all reset session API requests using Joi.
 * Provides custom error messages for better user feedback.
 */

import Joi from 'joi';

const startResetSchema = Joi.object({
  deviceId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'Device ID must be a string',
    'string.pattern.base': 'Device ID must be a valid ObjectId',
    'any.required': 'Device ID is required',
  }),
  audioId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'Audio ID must be a string',
    'string.pattern.base': 'Audio ID must be a valid ObjectId',
    'any.required': 'Audio ID is required',
  }),
  startedAt: Joi.date().iso().required().messages({
    'date.base': 'Start time must be a valid date',
    'date.format': 'Start time must be in ISO 8601 format',
    'any.required': 'Start time is required',
  }),
  triggerSource: Joi.string().valid('manual', 'scheduled', 'notification', 'widget').optional().allow(null, '').messages({
    'string.base': 'Trigger source must be a string',
    'any.only': 'Trigger source must be manual, scheduled, notification, or widget',
  }),
  selectedDurationMinutes: Joi.number().valid(7, 10, 15).required().messages({
    'number.base': 'Duration must be a number',
    'any.only': 'Duration must be 7, 10, or 15 minutes',
    'any.required': 'Duration is required',
  }),
  headphoneId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null, '').messages({
    'string.base': 'Headphone ID must be a string',
    'string.pattern.base': 'Headphone ID must be a valid ObjectId',
  }),
  headphoneAction: Joi.string().valid('skip', 'connect').optional().messages({
    'string.base': 'Headphone action must be a string',
    'any.only': 'Headphone action must be skip or connect',
  }),
});


const endResetSchema = Joi.object({
  endedAt: Joi.date().iso().required().messages({
    'date.base': 'End time must be a valid date',
    'date.format': 'End time must be in ISO 8601 format',
    'any.required': 'End time is required',
  }),
  status: Joi.string().valid('completed', 'interrupted').required().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be completed or interrupted',
    'any.required': 'Status is required',
  }),
  endedBy: Joi.string().valid('user', 'auto').required().messages({
    'string.base': 'Ended by must be a string',
    'any.only': 'Ended by must be user or auto',
    'any.required': 'Ended by is required',
  }),
  actualDurationSeconds: Joi.number().integer().min(0).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration cannot be negative',
    'any.required': 'Actual duration is required',
  }),
});


const historyQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Offset must be a number',
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset cannot be negative',
  }),
  status: Joi.string().valid('started', 'completed', 'interrupted').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be started, completed, or interrupted',
  }),
});


const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    if (property === 'query') {
      Object.assign(req.query, value);
    } else {
      req[property] = value;
    }
    next();
  };
};

export const validateStartReset = validate(startResetSchema, 'body');
export const validateEndReset = validate(endResetSchema, 'body');
export const validateHistoryQuery = validate(historyQuerySchema, 'query');
