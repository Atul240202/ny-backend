/**
 * ResetSession Model
 * Stores 40Hz audio meditation session data with duration, status, and headphone info.
 * Collection: reset_sessions
 */

import mongoose from 'mongoose';

const resetSessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Device ID is required'],
      index: true,
    },
    audioId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Audio ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    startedAt: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    triggerSource: {
      type: String,
      enum: {
        values: ['manual', 'scheduled', 'notification', 'widget'],
        message: 'Trigger source must be manual, scheduled, notification, or widget',
      },
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    selectedDurationMinutes: {
      type: Number,
      required: [true, 'Selected duration is required'],
      enum: {
        values: [7, 10, 15],
        message: 'Duration must be 7, 10, or 15 minutes',
      },
    },
    actualDurationSeconds: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['started', 'completed', 'interrupted'],
        message: 'Status must be started, completed, or interrupted',
      },
      default: 'started',
      index: true,
    },
    endedBy: {
      type: String,
      enum: {
        values: ['user', 'auto'],
        message: 'Ended by must be user or auto',
      },
      default: null,
    },
    headphoneId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
    },
    headphoneAction: {
      type: String,
      enum: {
        values: ['skip', 'connect'],
        message: 'Headphone action must be skip or connect',
      },
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'reset_sessions',
  },
);

resetSessionSchema.index({ userId: 1, startedAt: -1 });
resetSessionSchema.index({ userId: 1, status: 1 });

const ResetSession = mongoose.model('ResetSession', resetSessionSchema);

export default ResetSession;
