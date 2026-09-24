/**
 * Notification Service
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 * Works for both Android and iOS
 */

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import Logger from '../utils/logger';

class NotificationService {
    constructor() {
        this.unsubscribeOnMessage = null;
        this.unsubscribeOnNotificationOpened = null;
    }

    /**
     * Initialize notification service
     * Call this on app start (e.g., in App.js or AppContext)
     */
    async initialize() {
        try {
            // Request permission (required for iOS, Android 13+)
            const hasPermission = await this.requestPermission();

            if (!hasPermission) {
                Logger.warn('[NOTIFICATIONS] Permission not granted');
                return false;
            }

            // Get and save FCM token
            await this.getAndSaveToken();

            // Set up token refresh listener
            messaging().onTokenRefresh(async (newToken) => {
                Logger.info('[NOTIFICATIONS] Token refreshed');
                await this.saveTokenToFirestore(newToken);
            });

            // Set up foreground message handler
            this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
                Logger.info('[NOTIFICATIONS] Foreground message received:', remoteMessage.notification?.title);
                this.handleForegroundMessage(remoteMessage);
            });

            // Set up notification opened handler (app was in background)
            this.unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
                Logger.info('[NOTIFICATIONS] Notification opened app:', remoteMessage.notification?.title);
                this.handleNotificationOpened(remoteMessage);
            });

            // Check if app was opened from a notification (app was closed)
            const initialNotification = await messaging().getInitialNotification();
            if (initialNotification) {
                Logger.info('[NOTIFICATIONS] App opened from notification:', initialNotification.notification?.title);
                this.handleNotificationOpened(initialNotification);
            }

            Logger.info('[NOTIFICATIONS] Service initialized');
            return true;

        } catch (error) {
            Logger.error('[NOTIFICATIONS] Initialization error:', error);
            return false;
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        try {
            // iOS permission request
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                Logger.info('[NOTIFICATIONS] iOS permission granted:', authStatus);
            }

            // Android 13+ requires POST_NOTIFICATIONS permission
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const result = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                    Logger.warn('[NOTIFICATIONS] Android permission denied');
                    return false;
                }
            }

            return enabled;

        } catch (error) {
            Logger.error('[NOTIFICATIONS] Permission request error:', error);
            return false;
        }
    }

    /**
     * Get FCM token and save to Firestore
     */
    async getAndSaveToken() {
        try {
            const token = await messaging().getToken();

            if (token) {
                Logger.info('[NOTIFICATIONS] FCM Token obtained:', token.substring(0, 20) + '...');
                await this.saveTokenToFirestore(token);
                return token;
            }

            Logger.warn('[NOTIFICATIONS] No FCM token available');
            return null;

        } catch (error) {
            Logger.error('[NOTIFICATIONS] Token retrieval error:', error);
            return null;
        }
    }

    /**
     * Save FCM token to user's Firestore document
     */
    async saveTokenToFirestore(token) {
        try {
            const user = auth().currentUser;

            if (!user) {
                Logger.warn('[NOTIFICATIONS] No user logged in, cannot save token');
                return false;
            }

            await firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                    fcmToken: token,
                    fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
                    platform: Platform.OS,
                });

            Logger.info('[NOTIFICATIONS] FCM token saved to Firestore');
            return true;

        } catch (error) {
            Logger.error('[NOTIFICATIONS] Token save error:', error);
            return false;
        }
    }

    /**
     * Handle foreground notifications (show alert)
     */
    handleForegroundMessage(remoteMessage) {
        const { notification, data } = remoteMessage;

        if (notification) {
            // Show an alert for foreground notifications
            Alert.alert(
                notification.title || 'Notification',
                notification.body || '',
                [
                    { text: 'Dismiss', style: 'cancel' },
                    {
                        text: 'View',
                        onPress: () => this.handleNotificationAction(data),
                    },
                ]
            );
        }
    }

    /**
     * Handle notification tap (navigate to appropriate screen)
     */
    handleNotificationOpened(remoteMessage) {
        const { data } = remoteMessage;
        this.handleNotificationAction(data);
    }

    /**
     * Execute notification action based on data payload
     */
    handleNotificationAction(data) {
        if (!data) return;

        // Navigation will be set up when integrating with navigation context
        // For now, log the action
        Logger.info('[NOTIFICATIONS] Action:', data.action || 'default');

        // Supported actions:
        // - action: 'daily_challenge' -> Navigate to DailyGameScreen
        // - action: 'review_cards' -> Navigate to ReviewSessionScreen
        // - action: 'streak_reminder' -> Navigate to HomeScreen
    }

    /**
     * Cleanup listeners (call on logout or app unmount)
     */
    cleanup() {
        if (this.unsubscribeOnMessage) {
            this.unsubscribeOnMessage();
            this.unsubscribeOnMessage = null;
        }
        if (this.unsubscribeOnNotificationOpened) {
            this.unsubscribeOnNotificationOpened();
            this.unsubscribeOnNotificationOpened = null;
        }
        Logger.info('[NOTIFICATIONS] Service cleaned up');
    }

    /**
     * Delete FCM token (call on logout)
     */
    async deleteToken() {
        try {
            await messaging().deleteToken();

            const user = auth().currentUser;
            if (user) {
                await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .update({
                        fcmToken: firestore.FieldValue.delete(),
                        fcmTokenUpdatedAt: firestore.FieldValue.delete(),
                    });
            }

            Logger.info('[NOTIFICATIONS] Token deleted');
            return true;

        } catch (error) {
            Logger.error('[NOTIFICATIONS] Token deletion error:', error);
            return false;
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
