/**
 * Audio Session Model
 * 
 * Tracks user sessions for My Audio feature (40 Hz Gamma Binaural Beats)
 * Separate collection from existing Pause reset sessions
 */

import mongoose from 'mongoose';

const audioSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  audio_id: {
    type: String,
    required: true,
    enum: ['audio_001', 'audio_002', 'audio_003', 'audio_004'],
  },
  audio_file_name: {
    type: String,
    required: true,
  },
  audio_display_name: {
    type: String,
    required: true,
  },
  session_start: {
    type: Date,
    required: true,
  },
  session_end: {
    type: Date,
    required: true,
  },
  play_duration_seconds: {
    type: Number,
    required: true,
  },
  bluetooth_verified: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for querying user sessions
audioSessionSchema.index({ user_id: 1, created_at: -1 });

const AudioSession = mongoose.model('AudioSession', audioSessionSchema, 'audio_sessions');

export default AudioSession;
