import mongoose from 'mongoose';

const onboardingDefault = {
  steps: [
    {
      id: 'overwhelm_frequency',
      type: 'single_choice',
      question: 'How many times did you feel overwhelmed last week?',
      options: [
        { label: '0-1', value: '0-1' },
        { label: '2-3', value: '2-3' },
        { label: '4-6', value: '4-6' },
        { label: 'Almost every day', value: 'almost_daily' },
      ],
    },
    {
      id: 'work_hours',
      type: 'time_range',
      question: 'What are your usual work hours?',
    },
    {
      id: 'max_reset_time',
      type: 'single_choice',
      question: 'What’s the maximum time a reset should run?',
      options: [
        { label: '7 minutes', value: '7' },
        { label: '10 minutes', value: '10' },
        { label: '15 minutes', value: '15' },
      ],
    },
  ],
};

const appConstantSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      default: 'onboarding',
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: function () {
        if (this.type === 'onboarding') {
          return onboardingDefault;
        }
        return {};
      },
    },

    version: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

appConstantSchema.index({ type: 1, isActive: 1 });

const AppConstant = mongoose.model('AppConstant', appConstantSchema);

export default AppConstant;
