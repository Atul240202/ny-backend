import mongoose from 'mongoose';
import UserSettings from '../models/userSettings.js';
import { logger } from '../utils/logger.js';

export const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const settings = await UserSettings.findOne({ userId }).lean();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'failed to retrieve settings',
    });
  }
};


export const upsertUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const {
      healthconnectEnabled,
      heartratepermissiongiven,
      stepscountpermissiongiven,
      preferredAudioMode,
      volumeLevel,
    } = req.body;

    const updateData = {};


    if (typeof healthconnectEnabled === 'boolean') {
      updateData.healthconnectEnabled = healthconnectEnabled;
    }

    if (typeof heartratepermissiongiven === 'boolean') {
      updateData.heartratepermissiongiven = heartratepermissiongiven;
    }

    if (typeof stepscountpermissiongiven === 'boolean') {
      updateData.stepscountpermissiongiven = stepscountpermissiongiven;
    }

    if (typeof preferredAudioMode === 'string') {
      updateData.preferredAudioMode = preferredAudioMode;
    }

    if (typeof volumeLevel === 'number') {
      updateData.volumeLevel = volumeLevel;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    logger.error('Upsert settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'failed to update settings',
    });
  }
};
