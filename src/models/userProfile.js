import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    onboardingVersion: {
      type: Number,
      required: true,
    },

    responses: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    voiceRecordingUrl: {
      type: String,
      default: null,
    },

    voiceRecordingKey: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model('UserProfile', userProfileSchema);
