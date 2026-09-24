import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import firebaseService from '../services/firebaseService';
import analyticsService from '../services/analyticsService';
import paywallService from '../services/paywallService';
import notificationService from '../services/notificationService';
import { SUBSCRIPTION_TIERS } from '../constants/scenarios';
import Logger from '../utils/logger';
import { useTheme } from './ThemeContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const [extraChats, setExtraChats] = useState(0);
  const { setTheme } = useTheme();

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = firebaseService.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Set user ID for Crashlytics tracking (for existing sessions)
        Logger.setUserId(firebaseUser.uid);
        Logger.setAttributes({
          email: firebaseUser.email || 'no-email',
          displayName: firebaseUser.displayName || 'no-name',
        });

        // Initialize RevenueCat with user ID
        try {
          await paywallService.initialize(firebaseUser.uid);
          Logger.log('✅ RevenueCat initialized for user:', firebaseUser.uid);
        } catch (error) {
          Logger.error('RevenueCat initialization failed:', error);
        }

        // Initialize notifications and save FCM token
        try {
          await notificationService.initialize();
          Logger.log('✅ Notifications initialized for user:', firebaseUser.uid);
        } catch (error) {
          Logger.error('Notification initialization failed:', error);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to user profile changes
  useEffect(() => {
    let unsubscribeProfile = () => { };

    if (user) {
      setLoading(true);

      // Check for daily usage reset on load
      firebaseService.checkAndResetDailyUsage(user.uid)
        .catch(err => Logger.error('Error checking daily usage:', err));

      unsubscribeProfile = firebaseService.subscribeToUserProfile(user.uid, async (profile) => {
        if (profile) {
          // NOTE: Username auto-generation removed - this was incorrectly overwriting
          // existing users' usernames after app reinstall. The backend create-profile.js
          // already handles username creation for truly new users.

          // Sync interview count if missing (retroactive fix)
          if (profile.totalInterviews === undefined) {
            firebaseService.syncInterviewCount(user.uid)
              .catch(err => Logger.error('Error syncing interview count:', err));
          }

          // Migrate preferredLanguage to nativeLanguage for existing users
          // This runs once: if user has old preferredLanguage but no nativeLanguage
          if (profile.preferredLanguage && !profile.nativeLanguage) {
            Logger.log('Migrating preferredLanguage to nativeLanguage:', profile.preferredLanguage);
            try {
              await firebaseService.updateUserProfile(user.uid, {
                nativeLanguage: profile.preferredLanguage,
                preferredLanguage: null  // Clear to trigger PreferredLanguageModal
              });
              // Profile update will trigger another subscription callback
            } catch (err) {
              Logger.error('Failed to migrate language fields:', err);
            }
          }

          setUserProfile(profile);
          setDailyUsage(profile.dailyUsage || 0);
          setExtraChats(profile.extraChats || 0);
          setCurrentStreak(profile.currentStreak || 0);

          // Restore Theme Preference
          if (profile.activeTheme) {
            setTheme(profile.activeTheme);
          } else {
            setTheme('light');
          }

          // Initialize SFX Service with user preferences
          // Default to true if undefined (for new users or migration)
          const sfxEnabled = profile.sfxEnabled ?? true;
          const vibrationEnabled = profile.vibrationEnabled ?? true;

          // Import sfxService here to avoid circular dependency issues if any, 
          // or just use the imported instance
          const sfxService = require('../services/sfxService').default;
          sfxService.initializeSettings(sfxEnabled, vibrationEnabled);

          // Reset extra chats if it's a new day (usage is 0)
          if ((profile.dailyUsage || 0) === 0) {
            setExtraChats(0);
          }
        } else {
          // Profile might not exist yet (new user)
          setUserProfile(null);
          setDailyUsage(0);
          setCurrentStreak(0);
        }
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setDailyUsage(0);
      setCurrentStreak(0);
      setExtraChats(0);
    }

    return () => {
      unsubscribeProfile();
    };
  }, [user]);

  // Manual refresh helper (mostly for debugging or forced sync)
  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      try {
        await firebaseService.checkAndResetDailyUsage(user.uid);
      } catch (error) {
        Logger.error('Error refreshing profile:', error);
      }
    }
  }, [user?.uid]);

  const signIn = async (email, password) => {
    try {
      const user = await firebaseService.signInWithEmail(email, password);
      // Profile loading handled by subscription

      // Track login for analytics
      analyticsService.trackLogin(user.uid, 'email');

      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      const user = await firebaseService.createAccount(email, password, displayName);
      // Profile loading handled by subscription
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const user = await firebaseService.signInWithGoogle();
      // Profile loading handled by subscription

      // Track login for analytics
      analyticsService.trackLogin(user.uid, 'google');

      return user;
    } catch (error) {
      Logger.error('Google sign-in error in AppContext:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      const user = await firebaseService.signInWithApple();
      // Profile loading handled by subscription
      return user;
    } catch (error) {
      Logger.error('Apple sign-in error in AppContext:', error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const user = await firebaseService.signInWithFacebook();
      // Profile loading handled by subscription

      // Track login for analytics
      analyticsService.trackLogin(user.uid, 'facebook');

      return user;
    } catch (error) {
      Logger.error('Facebook sign-in error in AppContext:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Cleanup notifications and delete FCM token
      notificationService.cleanup();
      await notificationService.deleteToken();

      await firebaseService.signOut();
      setTheme('light'); // Reset theme on sign out
      setUser(null);
      setUserProfile(null);
      setDailyUsage(0);
      setCurrentStreak(0);
      setExtraChats(0);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await firebaseService.sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data) => {
    try {
      await firebaseService.updateUserProfile(user.uid, data);
      // Profile loading handled by subscription
    } catch (error) {
      throw error;
    }
  };

  const incrementUsage = async () => {
    try {
      await firebaseService.incrementDailyUsage(user.uid);
      // State update handled by subscription
    } catch (error) {
      throw error;
    }
  };

  const updateStreak = async () => {
    try {
      const newStreak = await firebaseService.updateStreak(user.uid);
      setCurrentStreak(newStreak);
      return newStreak;
    } catch (error) {
      throw error;
    }
  };

  const getDailyLimit = () => {
    const tier = userProfile?.subscriptionTier || 'free';
    return SUBSCRIPTION_TIERS[tier.toUpperCase()]?.dailyLimit || 10;
  };

  const hasReachedLimit = () => {
    // Limit is base limit + any extra chats earned from ads
    const totalLimit = getDailyLimit() + extraChats;
    return dailyUsage >= totalLimit;
  };

  const earnExtraChats = async (amount) => {
    try {
      await firebaseService.addExtraChats(user.uid, amount);
      // State update handled by subscription
    } catch (error) {
      Logger.error('Failed to earn extra chats:', error);
    }
  };

  const isPro = () => {
    // First check RevenueCat (source of truth for subscriptions)
    if (paywallService.isPro()) {
      return true;
    }

    // Fallback to Firestore for manual grants (admin, testing, etc.)
    return userProfile?.subscriptionTier === 'pro';
  };

  // SFX & Vibration Toggles (Persisted to Firestore)
  const toggleSfx = async (enabled) => {
    if (!user?.uid) return;
    try {
      // Update local service immediately for responsiveness
      const sfxService = require('../services/sfxService').default;
      sfxService.setSfxEnabled(enabled);

      // Persist to Firestore
      await firebaseService.updateUserProfile(user.uid, { sfxEnabled: enabled });
    } catch (error) {
      Logger.error('Failed to toggle SFX:', error);
      throw error;
    }
  };

  const toggleVibration = async (enabled) => {
    if (!user?.uid) return;
    try {
      // Update local service immediately for responsiveness
      const sfxService = require('../services/sfxService').default;
      sfxService.setVibrationEnabled(enabled);

      // Persist to Firestore
      await firebaseService.updateUserProfile(user.uid, { vibrationEnabled: enabled });
    } catch (error) {
      Logger.error('Failed to toggle Vibration:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    dailyUsage,
    currentStreak,
    extraChats,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    signOut,
    resetPassword,
    updateProfile,
    incrementUsage,
    updateStreak,
    getDailyLimit,
    hasReachedLimit,
    earnExtraChats,
    isPro,
    refreshProfile,
    toggleSfx,
    toggleVibration
  }), [
    user,
    userProfile,
    loading,
    dailyUsage,
    currentStreak,
    extraChats,
    refreshProfile
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

