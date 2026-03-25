const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Note: You need to place your firebase-service-account.json in the backend/config directory
// or set the environment variables.
try {
  const serviceAccount = require('../config/firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization failed:', error.message);
  console.info('Wait: Firebase service account file might be missing or invalid. Notifications will not be sent via FCM until configured.');
}

const sendNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      notification_type: data.type || 'general',
      eventId: data.eventId || '',
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    throw error;
  }
};

const sendToMultiple = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens || fcmTokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      notification_type: data.type || 'event',
      sender_role: 'organizer',
    },
    tokens: fcmTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
    return response;
  } catch (error) {
    console.error('Error sending multicast FCM message:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendToMultiple,
  admin
};
