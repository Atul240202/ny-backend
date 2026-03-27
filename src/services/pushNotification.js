import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

export async function sendAlertToUser(userId, data) {
  try {
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      const message = {
        token: user.fcmToken,
        data,
        android: {
          priority: 'high',
          ttl: 60 * 60 * 1000,
        },
        apns: {
          headers: {
            'apns-priority': '5',
          },
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      logger.info(`Notification sent to ${user._id}`, response);
    } else {
      logger.warn(`User ${userId} not found or has no FCM token`);
    }
  } catch (error) {
    logger.error('Error sending targeted notification:', error);
    throw error;
  }
}
