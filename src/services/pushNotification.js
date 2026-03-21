import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

// Mock Data
const heartRates = [75, 80, 102, 90, 98];

export async function checkHeartRateAndNotify() {

  try {

    const users = await User.find({
      fcmToken: { $exists: true, $ne: null },
    });

    for (const rate of heartRates) {

      logger.info('Checking:', rate);

      if (rate >= 100) {

        for (const user of users) {

          const message = {
            token: user.fcmToken,
            data: {
              type: 'HEART_RATE_ALERT',
              value: rate.toString(),
            },
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

          try {
            const response = await admin.messaging().send(message);
            logger.info(`Notification sent to ${user._id}`, response);
          } catch (error) {
            logger.error('Error sending notification:', error);
          }

        }

      }

    }

  } catch (error) {
    logger.error('Heart rate check failed:', error);
  }
}
