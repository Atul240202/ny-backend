/**
 * User Model
 *
 * MongoDB schema for user data including Google OAuth information and onboarding status.
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['google', 'manual'],
      required: true,
      default: 'google',
    },
    name: String,
    photoUrl: String,
    phoneNumber: {
      type: String,
      sparse: true,
      index: true,
    },
    age: Number,
    city: String,
    country: String,
    gender: String,
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

export default model('User', userSchema);
