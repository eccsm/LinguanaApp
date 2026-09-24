import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { startOfDay, differenceInDays } from 'date-fns';
import { GOOGLE_WEB_CLIENT_ID, BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import Logger from '../utils/logger';

/**
 * Firebase Service for user data, chat history, and usage tracking
 */
class FirebaseService {
  constructor() {
    this.db = firestore();
    this.auth = auth();
    this._incrementLock = false; // Lock for preventing race conditions in increment

    Logger.info('Configuring Google Sign-In with Web Client ID:', GOOGLE_WEB_CLIENT_ID);
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }

  // ==================== User Management ====================

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  async signInWithGoogle() {
    Logger.info('=== GOOGLE SIGN-IN STARTED ===');
    try {
      Logger.info('Step 1: Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      Logger.info('Step 1: ✓ Google Play Services available');

      Logger.info('Step 2: Requesting Google Sign-In...');
      const signInResult = await GoogleSignin.signIn();
      Logger.info('Step 2: ✓ Sign-In result received:', JSON.stringify(signInResult));

      // Check if user cancelled
      if (signInResult?.type === 'cancelled') {
        Logger.info('Step 2: User cancelled sign-in');
        throw new Error('User cancelled the login process');
      }

      // Extract idToken from the nested data object
      const idToken = signInResult?.data?.idToken || signInResult?.idToken;

      if (!idToken) {
        Logger.error('Step 2: ✗ No idToken in result!');
        throw new Error('No idToken received from Google Sign-In');
      }
      Logger.info('Step 3: Creating Firebase credential...');
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      Logger.info('Step 3: ✓ Firebase credential created');

      Logger.info('Step 4: Signing in with Firebase...');
      const userCredential = await auth().signInWithCredential(googleCredential);
      Logger.info('Step 4: ✓ Signed in with Firebase:', userCredential.user.uid);

      // Handle profile creation/update
      Logger.info('Step 5: Managing user profile...');

      if (userCredential.additionalUserInfo?.isNewUser) {
        // Brand new user - create full profile
        Logger.info('New user detected, creating full profile');
        await this.checkAndInitializeProfile(
          userCredential.user.uid,
          userCredential.user.email,
          userCredential.user.displayName
        );
      } else {
        // Existing user - only update email/displayName
        Logger.info('Existing user, updating contact info only');
        await this.initializeUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName
        });
      }

      Logger.info('Step 5: ✓ Profile managed');

      // Set user ID for Crashlytics tracking
      Logger.setUserId(userCredential.user.uid);
      Logger.setAttributes({
        email: userCredential.user.email || 'no-email',
        displayName: userCredential.user.displayName || 'no-name',
        authProvider: 'google',
        isNewUser: userCredential.additionalUserInfo?.isNewUser || false
      });

      // Check for multiple accounts warning
      const existingUser = await this.findUserByEmail(userCredential.user.email);
      if (existingUser && existingUser.id !== userCredential.user.uid) {
        Logger.info('⚠️ Multiple accounts detected for email:', userCredential.user.email);
      }

      return userCredential.user;
    } catch (error) {
      Logger.error('Google sign-in error:', error);
      Logger.error('Error code:', error?.code || 'No code');
      Logger.error('Error message:', error?.message || error?.toString() || 'Unknown error');
      throw error;
    }
  }

  async signInWithFacebook() {
    Logger.info('=== FACEBOOK SIGN-IN STARTED ===');
    try {
      // Import Facebook SDK dynamically
      const { LoginManager, AccessToken } = require('react-native-fbsdk-next');

      Logger.info('Step 1: Requesting Facebook login with permissions...');
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }
      Logger.info('Step 1: ✓ Facebook login successful');

      Logger.info('Step 2: Getting Facebook access token...');
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Something went wrong obtaining access token');
      }
      Logger.info('Step 2: ✓ Access token obtained');

      Logger.info('Step 3: Creating Firebase credential...');
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      Logger.info('Step 3: ✓ Firebase credential created');

      Logger.info('Step 4: Signing in with Firebase...');
      const userCredential = await auth().signInWithCredential(facebookCredential);
      Logger.info('Step 4: ✓ Signed in with Firebase:', userCredential.user.uid);

      // Handle profile creation/update
      Logger.info('Step 5: Managing user profile...');

      if (userCredential.additionalUserInfo?.isNewUser) {
        // Brand new user - create full profile
        Logger.info('New user detected, creating full profile');
        await this.checkAndInitializeProfile(
          userCredential.user.uid,
          userCredential.user.email,
          userCredential.user.displayName
        );
      } else {
        // Existing user - only update email/displayName
        Logger.info('Existing user, updating contact info only');
        await this.initializeUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName
        });
      }

      Logger.info('Step 5: ✓ Profile managed');

      // Set user ID for Crashlytics tracking
      Logger.setUserId(userCredential.user.uid);
      Logger.setAttributes({
        email: userCredential.user.email || 'no-email',
        displayName: userCredential.user.displayName || 'no-name',
        authProvider: 'facebook',
        isNewUser: userCredential.additionalUserInfo?.isNewUser || false
      });

      // Check for multiple accounts warning
      const existingUser = await this.findUserByEmail(userCredential.user.email);
      if (existingUser && existingUser.id !== userCredential.user.uid) {
        Logger.info('⚠️ Multiple accounts detected for email:', userCredential.user.email);
      }

      return userCredential.user;
    } catch (error) {
      Logger.error('Facebook sign-in error:', error);
      Logger.error('Error code:', error?.code || 'No code');
      Logger.error('Error message:', error?.message || error?.toString() || 'Unknown error');
      throw error;
    }
  }

  async signInWithApple() {
    Logger.info('=== APPLE SIGN-IN STARTED ===');
    try {
      Logger.info('Step 1: Requesting Apple Sign-In...');
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      Logger.info('Step 1: ✓ Apple Sign-In response received');

      if (!appleAuthRequestResponse.identityToken) {
        Logger.error('Step 1: ✗ No identity token!');
        throw new Error('Apple Sign-In failed - no identity token returned');
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      Logger.info('Step 2: Creating Firebase credential...');
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
      Logger.info('Step 2: ✓ Firebase credential created');

      Logger.info('Step 3: Signing in with Firebase...');
      const userCredential = await auth().signInWithCredential(appleCredential);
      Logger.info('Step 3: ✓ Signed in with Firebase:', userCredential.user.uid);

      // Create user profile if new user
      if (userCredential.additionalUserInfo?.isNewUser) {
        Logger.info('New user, creating profile...');
        const displayName = appleAuthRequestResponse.fullName
          ? `${appleAuthRequestResponse.fullName.givenName || ''} ${appleAuthRequestResponse.fullName.familyName || ''}`.trim()
          : 'Apple User';

        await this.initializeUserProfile(userCredential.user.uid, {
          email: userCredential.user.email,
          displayName: displayName || 'Apple User'
        });
      }

      // Set user ID for Crashlytics tracking
      Logger.setUserId(userCredential.user.uid);
      Logger.setAttributes({
        email: userCredential.user.email || 'no-email',
        displayName: displayName || 'Apple User',
        authProvider: 'apple',
        isNewUser: userCredential.additionalUserInfo?.isNewUser || false
      });

      Logger.info('Apple Sign-In completed successfully');
      return userCredential.user;
    } catch (error) {
      Logger.error('Apple sign-in error:', error);
      Logger.error('Error code:', error?.code || 'No code');
      Logger.error('Error message:', error?.message || error?.toString() || 'Unknown error');
      throw error;
    }
  }

  /**
   * Sign in with email/password
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);

      // Set user ID for Crashlytics tracking
      Logger.setUserId(userCredential.user.uid);
      Logger.setAttributes({
        email: userCredential.user.email || 'no-email',
        displayName: userCredential.user.displayName || 'no-name',
        authProvider: 'email',
        isNewUser: false
      });

      return userCredential.user;
    } catch (error) {
      Logger.error('Email sign-in error:', error);
      throw error;
    }
  }

  /**
   * Create account with email/password
   */
  async createAccount(email, password, displayName) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName });
      await this.initializeUserProfile(userCredential.user.uid, { email, displayName });

      // Set user ID for Crashlytics tracking
      Logger.setUserId(userCredential.user.uid);
      Logger.setAttributes({
        email: email,
        displayName: displayName,
        authProvider: 'email',
        isNewUser: true
      });

      return userCredential.user;
    } catch (error) {
      Logger.error('Account creation error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      Logger.error('Sign-out error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      Logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Initialize user profile in Firestore
   * ONLY sets email/displayName to preserve existing stats!
   * Full profile with stats created by checkAndInitializeProfile()
   */
  async initializeUserProfile(userId, additionalData = {}) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      Logger.info('Updating user profile (email/name only):', userId);

      // ONLY set email and displayName - never touch stats!
      // This preserves dailyUsage, streaks, conversations, etc.
      const safeUpdate = {};
      if (additionalData.email) safeUpdate.email = additionalData.email;
      if (additionalData.displayName) safeUpdate.displayName = additionalData.displayName;

      if (Object.keys(safeUpdate).length > 0) {
        await userRef.set(safeUpdate, { merge: true });
        Logger.info('✓ Profile updated (stats preserved):', userId);
      }
    } catch (error) {
      Logger.error('Error updating profile:', error);
    }
  }

  /**
   * Generate a random username for new users
   * Format: Learner_XXXXX (5 random digits)
   */
  generateRandomUsername() {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    return `Learner_${randomNum}`;
  }

  /**
   * Create complete profile for brand new users
   * ONLY called when additionalUserInfo.isNewUser = true
   */
  /**
   * Create complete profile for brand new users
   * ONLY called when additionalUserInfo.isNewUser = true
   */
  async checkAndInitializeProfile(userId, email = null, displayName = null) {
    try {
      Logger.info('Creating new user profile via backend:', userId);

      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user found');

      const token = await user.getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-client-secret': APP_CLIENT_SECRET
        },
        body: JSON.stringify({
          email,
          displayName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Backend profile creation failed:', errorText);
        throw new Error(`Failed to create profile: ${response.status}`);
      }

      const result = await response.json();
      Logger.info('✓ New user profile created via backend:', result.profile?.username);

    } catch (error) {
      Logger.error('Error creating profile:', error);
      throw error; // Throw so sign-in knows it failed
    }
  }

  /**
   * Find existing user by email across all auth providers
   */
  async findUserByEmail(email) {
    if (!email) return null;

    try {
      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      Logger.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      // If permission denied or not found, the document doesn't exist yet
      // This is normal for new users, so return null instead of throwing
      if (error.code === 'firestore/permission-denied' || error.code === 'firestore/not-found') {
        Logger.info('User profile not found (will be created):', userId);
        return null;
      }
      Logger.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, data) {
    try {
      // Use set with merge to create document if it doesn't exist
      await this.db.collection('users').doc(userId).set(data, { merge: true });
    } catch (error) {
      Logger.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeToUserProfile(userId, onUpdate) {
    try {
      return this.db.collection('users').doc(userId).onSnapshot(
        doc => {
          if (doc.exists) {
            onUpdate({ id: doc.id, ...doc.data() });
          } else {
            // Profile might not exist yet
            onUpdate(null);
          }
        },
        error => {
          Logger.error('Profile subscription error:', error);
        }
      );
    } catch (error) {
      Logger.error('Error setting up profile subscription:', error);
      return () => { }; // Return empty unsubscribe function
    }
  }

  // ==================== Usage Tracking ====================

  /**
   * Get UTC date string for consistent global day boundaries
   * Format: "YYYY-MM-DD" in UTC timezone
   */
  getUTCDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check and reset daily usage if needed (UTC Midnight Reset)
   */
  async checkAndResetDailyUsage(userId) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        Logger.info('Profile not found for daily usage check, returning 0');
        return 0;
      }

      const userData = doc.data();
      if (!userData) {
        return 0;
      }

      const lastResetTimestamp = userData.lastUsageReset;
      const now = new Date();

      let shouldReset = false;

      if (!lastResetTimestamp) {
        shouldReset = true;
      } else {
        // Convert Firestore timestamp to Date
        const lastResetDate = lastResetTimestamp.toDate ? lastResetTimestamp.toDate() : new Date(lastResetTimestamp);

        // Check if it's a different UTC calendar day (consistent global timing)
        if (this.getUTCDateString(lastResetDate) !== this.getUTCDateString(now)) {
          shouldReset = true;
        }
      }

      // Reset if it's a new day
      if (shouldReset) {
        Logger.info(`[DAILY-RESET] New day detected! Resetting limits for ${userId}`);
        await userRef.update({
          dailyUsage: 0,
          extraChats: 0,
          lastUsageReset: firestore.FieldValue.serverTimestamp()
        });
        return 0;
      }

      return userData.dailyUsage || 0;
    } catch (error) {
      // If permission denied, profile doesn't exist or can't be read yet
      if (error.code === 'firestore/permission-denied' || error.code === 'firestore/not-found') {
        Logger.info('Daily usage check - profile not accessible yet, returning 0');
        return 0;
      }
      Logger.error('Check daily usage error:', error);
      return 0;
    }
  }

  /**
   * Increment daily usage - with lock to prevent race conditions
   */
  async incrementDailyUsage(userId) {
    // Prevent multiple simultaneous calls
    if (this._incrementLock) {
      Logger.warn('[INCREMENT] ⚠️ Already incrementing, skipping duplicate call');
      return;
    }

    this._incrementLock = true;

    try {
      const userRef = this.db.collection('users').doc(userId);

      Logger.info('[INCREMENT] Attempting to increment daily usage for:', userId);

      // Get current value first for logging
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const currentUsage = userDoc.data().dailyUsage || 0;

      // Use atomic increment instead of transaction for reliability
      await userRef.update({
        dailyUsage: firestore.FieldValue.increment(1),
        totalConversations: firestore.FieldValue.increment(1)
      });

      Logger.info(`[INCREMENT] ✅ Success! Usage: ${currentUsage} -> ${currentUsage + 1}`);

    } catch (error) {
      // If profile doesn't exist, just log and continue
      // Profile will be available on next operation
      if (error.code === 'firestore/not-found' || error.code === 'firestore/permission-denied') {
        Logger.warn('[INCREMENT] ⚠️ Cannot increment usage - profile not ready yet');
        return;
      }
      Logger.error('[INCREMENT] ❌ Error incrementing usage:', error);
      throw error;
    } finally {
      // Release lock after a short delay to prevent rapid successive calls
      setTimeout(() => {
        this._incrementLock = false;
      }, 100);
    }
  }

  /**
   * Add extra chats to user profile (e.g. from watching ads)
   */
  async addExtraChats(userId, amount) {
    try {
      const user = auth().currentUser;
      if (!user) return false;

      const token = await user.getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/grant-rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-client-secret': APP_CLIENT_SECRET
        },
        body: JSON.stringify({
          type: 'ad_reward',
          rewardType: 'chat'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('[EXTRA-CHATS] Backend error:', errorText);
        return false;
      }

      const result = await response.json();
      Logger.info(`[EXTRA-CHATS] Added extra chat via backend. New count: ${result.newCount}`);
      return true;

    } catch (error) {
      Logger.error('[EXTRA-CHATS] Failed to add extra chats:', error);
      return false;
    }
  }

  /**
   * Check if user has reached daily limit
   */
  async hasReachedDailyLimit(userId, dailyLimit) {
    const currentUsage = await this.checkAndResetDailyUsage(userId);
    return currentUsage >= dailyLimit;
  }

  // ==================== Streak Management ====================

  /**
   * Update user streak
   */
  async updateStreak(userId) {
    try {
      const userRef = this.db.collection('users').doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        Logger.info('User profile not found for streak update, initializing...');
        await this.initializeUserProfile(userId);
        return 1; // Return initial streak
      }

      const userData = doc.data();
      if (!userData) {
        Logger.warn('User data is empty, returning default streak');
        return 1;
      }

      const today = startOfDay(new Date());
      const lastPractice = userData.lastPracticeDate?.toDate();

      let newStreak = 1;

      if (lastPractice) {
        const lastPracticeDay = startOfDay(lastPractice);
        const daysDiff = differenceInDays(today, lastPracticeDay);

        if (daysDiff === 0) {
          // Already practiced today
          return userData.currentStreak;
        } else if (daysDiff === 1) {
          // Consecutive day
          newStreak = (userData.currentStreak || 0) + 1;
        } else {
          // Streak broken - save previous streak before resetting
          if (userData.currentStreak > 1) {
            await userRef.update({
              previousStreak: userData.currentStreak
            });
          }
          newStreak = 1;
        }
      }

      const longestStreak = Math.max(newStreak, userData.longestStreak || 0);

      await userRef.update({
        currentStreak: newStreak,
        longestStreak: longestStreak,
        lastPracticeDate: firestore.FieldValue.serverTimestamp()
      });

      return newStreak;
    } catch (error) {
      Logger.error('Update streak error:', error);
      throw error;
    }
  }

  // ==================== Chat History ====================

  /**
   * Create a new conversation
   */
  async createConversation(userId, scenarioId, language) {
    try {
      const conversationRef = await this.db.collection('conversations').add({
        userId,
        scenarioId,
        language,
        createdAt: firestore.FieldValue.serverTimestamp(),
        messageCount: 0
      });
      return conversationRef.id;
    } catch (error) {
      Logger.error('Create conversation error:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(conversationId, role, content, metadata = {}) {
    try {
      await this.db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add({
          role,
          content,
          timestamp: firestore.FieldValue.serverTimestamp(),
          ...metadata
        });

      await this.db
        .collection('conversations')
        .doc(conversationId)
        .update({
          messageCount: firestore.FieldValue.increment(1),
          lastMessageAt: firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      Logger.error('Add message error:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId) {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
    } catch (error) {
      Logger.error('Get messages error:', error);
      throw error;
    }
  }

  /**
   * Get active conversation for a specific scenario and language
   * Returns the most recent conversation that hasn't reached the message limit
   */
  async getActiveConversation(userId, scenarioId, languageCode, messageLimit = 50) {
    try {
      // OPTIMIZATION: Query by specific fields but WITHOUT orderBy/limit to avoid composite index requirements.
      // Firestore can merge single-field indexes for equality checks efficiently.
      // We then sort in memory to find the latest one.

      const snapshot = await this.db
        .collection('conversations')
        .where('userId', '==', userId)
        .where('scenarioId', '==', scenarioId)
        .where('language', '==', languageCode)
        .get();

      if (snapshot.empty) {
        return null;
      }

      // Sort in memory by createdAt (descending)
      const sortedDocs = snapshot.docs.sort((a, b) => {
        const dateA = a.data().createdAt?.toDate?.() || new Date(0);
        const dateB = b.data().createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // Newest first
      });

      const match = sortedDocs[0];
      const data = match.data();

      // 1. Check if conversation is from TODAY (UTC)
      if (data.createdAt) {
        const createdDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const today = new Date();

        // Compare UTC dates for consistent global timing
        if (this.getUTCDateString(createdDate) !== this.getUTCDateString(today)) {
          Logger.info('Found conversation but it is from a previous day (UTC) - starting new one');
          return null;
        }
      }

      // 2. Check if message limit is reached
      if ((data.messageCount || 0) >= messageLimit) {
        Logger.info(`Found conversation but limit reached (${data.messageCount}/${messageLimit}) - starting new one`);
        return null;
      }

      return { id: match.id, ...data };

      return null;
    } catch (error) {
      Logger.error('Get active conversation error:', error);
      // If index is missing, it might fail. In that case, return null to start new.
      return null;
    }
  }

  /**
   * Get user's recent conversations
   */
  async getUserConversations(userId, limit = 20) {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      Logger.error('Get conversations error:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId) {
    try {
      // Delete all messages first
      const messagesSnapshot = await this.db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .get();

      const batch = this.db.batch();
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete conversation
      await this.db.collection('conversations').doc(conversationId).delete();
    } catch (error) {
      Logger.error('Delete conversation error:', error);
      throw error;
    }
  }
  /**
   * Sync total interviews count from history
   * Used for retroactively updating profile stats
   */
  async syncInterviewCount(userId) {
    try {
      const snapshot = await this.db
        .collection('conversations')
        .where('userId', '==', userId)
        .where('type', '==', 'interview')
        .get();

      const count = snapshot.size;

      if (count > 0) {
        await this.db.collection('users').doc(userId).update({
          totalInterviews: count
        });
        Logger.info(`Synced interview count for ${userId}: ${count}`);
      }

      return count;
    } catch (error) {
      Logger.error('Failed to sync interview count:', error);
      return 0;
    }
  }
}

export default new FirebaseService();
