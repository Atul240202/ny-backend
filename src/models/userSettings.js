import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    healthconnectEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    heartratepermissiongiven: {
      type: Boolean,
      required: true,
      default: false,
    },
    stepscountpermissiongiven: {
      type: Boolean,
      required: true,
      default: false,
    },
    preferredAudioMode: {
      type: String,
      enum: ['audio', 'vibration', 'silent'],
      default: 'audio',
    },
    volumeLevel: {
      type: Number,
      min: 0,
      max: 10,
      default: 2,
    },
  },
  { timestamps: true },
);

userSettingsSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('UserSettings', userSettingsSchema);
