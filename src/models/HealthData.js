/**
 * Health Data Model
 *
 * MongoDB schema for storing health data collected from devices
 *
 * Data format (consistent across watch → phone → MongoDB):
 * {
 *   user_id: String (watch device ID - unique per device),
 *   timestamp: String (ISO 8601 UTC format),
 *   rr_interval_ms: Number (heart rate RR interval),
 *   accel_x: Number (accelerometer X-axis),
 *   accel_y: Number (accelerometer Y-axis),
 *   accel_z: Number (accelerometer Z-axis),
 *   step_count: Number (cumulative steps)
 * }
 */

import mongoose from 'mongoose';

const healthDataSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: String,
      required: true,
      index: true,
    },
    rr_interval_ms: {
      type: Number,
      default: 0,
    },
    accel_x: {
      type: Number,
      default: 0,
    },
    accel_y: {
      type: Number,
      default: 0,
    },
    accel_z: {
      type: Number,
      default: 0,
    },
    step_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'healthdata',
  },
);

healthDataSchema.index({ user_id: 1, timestamp: 1 }, { unique: true });
healthDataSchema.index({ timestamp: -1 });
healthDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('HealthData', healthDataSchema);
