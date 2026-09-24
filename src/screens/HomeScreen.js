import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { useWalkthrough } from '../contexts/WalkthroughContext';
import { SCENARIOS, LANGUAGES } from '../constants/scenarios';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import { useFocusEffect } from '@react-navigation/native';
// UNIFIED MODAL
import PremiumLimitModal from '../components/PremiumLimitModal';
import StreakDetailsModal from '../components/StreakDetailsModal';
import PreferredLanguageModal from '../components/PreferredLanguageModal';
import { GemBadge, StreakBadge, InventoryBadge, MapBadge, LeaderboardBadge } from '../components/HeaderBadges';
import { BadgePillContainer } from '../components/BadgePillContainer';
import rewardedAdService from '../services/rewardedAdService';
import { useGamification } from '../features/GamificationFeatures';
import { COLORS } from '../constants/theme';
import { AnimatedButton, FadeInView, ScaleIn, PulseView } from '../components/AnimatedComponents';
import Haptics from '../utils/haptics';
import Logger from '../utils/logger';
import interviewService from '../services/interviewService';
import firebaseService from '../services/firebaseService';
import WeeklyWinnerModal from '../components/WeeklyWinnerModal';
import GlassContainer from '../components/common/GlassContainer';
import WagerCard from '../components/WagerCard';
import PurchasePackModal from '../components/PurchasePackModal';

const { width } = Dimensions.get('window');

// Consolidated Image Mapping
const SCENARIO_IMAGES = {
  'cafe': require('../../assets/ordering_cafe.jpg'),
  'restaurant': require('../../assets/restaurant.jpg'),
  'directions': require('../../assets/directions.jpg'),
  'hotel': require('../../assets/hotel.jpg'),
  'shopping': require('../../assets/shopping.jpg'),
  'airport': require('../../assets/airport.jpg'),
  'small_talk': require('../../assets/small_talk.jpg'),
  'taxi': require('../../assets/taxi.jpg'),
  'phone_call': require('../../assets/phone_call.jpg'),
  'doctor': require('../../assets/doctor.jpg'),
  'dating': require('../../assets/dating.jpg'),
  'flirting': require('../../assets/party.jpg'),
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    userProfile,
    dailyUsage,
    currentStreak,
    getDailyLimit,
    isPro,
    earnExtraChats,
    extraChats
  } = useApp();
  const { colors, activeTheme, isDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const { dueCards, stats, fetchDueCards } = useGamification();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Responsive sizing for small screens
  const isSmallScreen = screenHeight < 700;
  const isMediumScreen = screenHeight >= 700 && screenHeight < 800;
  // Tablet/large screen detection - show badges directly instead of expandable pill
  const isLargeScreen = screenWidth >= 500;

  const isCyberpunk = activeTheme === 'cyberpunk';

  // Check for Gold Frame ownership
  const hasGoldFrame = stats?.inventory?.frameGold > 0;

  // Safety checks for initial load
  const initialLanguage = userProfile?.preferredLanguage || (LANGUAGES?.ENGLISH?.code || 'en');
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showPreferredLanguageModal, setShowPreferredLanguageModal] = useState(false);
  const [chatAdsWatchedToday, setChatAdsWatchedToday] = useState(0);
  const [selectedScenarioIdForAd, setSelectedScenarioIdForAd] = useState(null);
  const MAX_ADS_PER_DAY = 5;
  const [speedSwipePlayedToday, setSpeedSwipePlayedToday] = useState(0);
  const SPEED_SWIPE_FREE_LIMIT = 1;
  const SPEED_SWIPE_TOTAL_LIMIT = 5; // 1 free + 4 ads

  // Roast Mode daily tracking (1 free via ad per day, then premium)
  const [roastModeUsedToday, setRoastModeUsedToday] = useState(false);

  const [cachedChallenge, setCachedChallenge] = useState(null);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(null); // null = loading, true/false = known
  const [weeklyChallengeCompleted, setWeeklyChallengeCompleted] = useState(null); // null = loading
  const [resetCountdown, setResetCountdown] = useState('');

  // Cache keys for challenge completion (with today's UTC date to auto-reset)
  const getUTCDateString = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  const DAILY_CACHE_KEY = `daily_completed_${getUTCDateString()}`;
  const WEEKLY_CACHE_KEY = `weekly_completed_${getUTCDateString()}`;

  const [dailyInterviews, setDailyInterviews] = useState(0);
  const [extraInterviews, setExtraInterviews] = useState(0);

  // Weekly winner modal state
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [pendingWeeklyReward, setPendingWeeklyReward] = useState(null);

  // Daily winner modal state
  const [showDailyWinnerModal, setShowDailyWinnerModal] = useState(false);
  const [pendingDailyReward, setPendingDailyReward] = useState(null);

  // Badge pill expansion state for scaling badges on small screens
  const [isPillExpanded, setIsPillExpanded] = useState(false);
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;

  // AbortController refs for cancellable network requests (prevents deadlock on navigation)
  const dailyFetchControllerRef = useRef(null);
  const weeklyFetchControllerRef = useRef(null);

  // Scenario pack modal state
  const [showPackModal, setShowPackModal] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedLockedScenario, setSelectedLockedScenario] = useState(null);

  // Check owned packs from user stats
  const ownedPacks = stats?.ownedPacks || {};

  // XP Boost active state (from XP Potion)
  const [xpBoostActive, setXpBoostActive] = useState(false);
  const [xpBoostExpiresAt, setXpBoostExpiresAt] = useState(null);
  const [xpBoostCountdown, setXpBoostCountdown] = useState('');

  // Walkthrough for new users
  const {
    isWalkthroughActive,
    currentStep,
    registerTarget,
    hasCompletedWalkthrough,
    triggerForNewUser,
    reMeasure,
    isLoading: walkthroughLoading
  } = useWalkthrough();

  // Check if preferredLanguage modal should be shown
  useEffect(() => {
    if (userProfile && userProfile.nativeLanguage && !userProfile.preferredLanguage) {
      setShowPreferredLanguageModal(true);
    }
  }, [userProfile]);

  // Trigger walkthrough for new users after profile loads AND languages are selected
  useEffect(() => {
    // Ensure user has completed onboarding (languages selected) before showing walkthrough
    const hasSelectedLanguages = userProfile?.nativeLanguage && userProfile?.preferredLanguage;

    if (userProfile && hasSelectedLanguages && !walkthroughLoading && !hasCompletedWalkthrough) {
      // Longer delay to let the screen animations complete and elements render
      const timer = setTimeout(() => {
        triggerForNewUser();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userProfile, walkthroughLoading, hasCompletedWalkthrough, triggerForNewUser]);

  useEffect(() => {
    loadAdWatchData();
    loadSpeedSwipeData();
    loadRoastModeData();
  }, []);

  // Countdown timer for challenge reset (midnight UTC)
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      // Calculate next midnight UTC
      const nextMidnightUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1, // Tomorrow
        0, 0, 0, 0 // Midnight
      ));

      const diff = nextMidnightUTC.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format as HH:MM:SS with zero padding
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    setResetCountdown(calculateTimeUntilReset());

    const interval = setInterval(() => {
      setResetCountdown(calculateTimeUntilReset());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load cached challenge completion status immediately to prevent flash
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const [dailyCached, weeklyCached] = await Promise.all([
          AsyncStorage.getItem(DAILY_CACHE_KEY),
          AsyncStorage.getItem(WEEKLY_CACHE_KEY),
        ]);
        // Set from cache immediately - null means we don't know yet (show nothing)
        // 'true' means completed, 'false' means not completed
        if (dailyCached !== null) {
          setDailyChallengeCompleted(dailyCached === 'true');
        }
        if (weeklyCached !== null) {
          setWeeklyChallengeCompleted(weeklyCached === 'true');
        }
      } catch (error) {
        Logger.error('[HOME] Error loading cached challenge status:', error);
      }
    };
    loadCachedStatus();
  }, [DAILY_CACHE_KEY, WEEKLY_CACHE_KEY]);

  // Walkthrough integration (moved to top)

  const scrollViewRef = useRef(null);
  const localRefs = useRef({}); // Store refs locally for measurement

  // Auto-scroll to target when walkthrough step changes
  useEffect(() => {
    if (isWalkthroughActive && currentStep?.targetKey && scrollViewRef.current) {
      const key = currentStep.targetKey;

      // Streak badge is in header (fixed), no need to scroll
      if (key === 'streak-badge') {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
        // Give time for scroll to top before measuring
        setTimeout(reMeasure, 800);
        return;
      }

      const ref = localRefs.current[key];
      if (ref && ref.measureInWindow) {
        // Use a slight delay to ensure layout is complete
        setTimeout(() => {
          ref.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              Logger.log('[HomeScreen] Auto-scroll target at screen y:', y);

              // Calculate how much to scroll based on screen position
              // If element is below visible area, scroll down
              // If element is above, scroll up (or it's already visible)
              const screenHeight = Dimensions.get('window').height;
              const targetVisibleY = isLargeScreen ? 200 : 150; // Where we want target to appear

              // Only scroll if element is not in ideal position
              if (y > targetVisibleY + 100 || y < targetVisibleY - 50) {
                // Calculate scroll offset (approximate - actual scroll position unknown)
                // We use the y coordinate as a hint for scrolling
                const scrollAmount = Math.max(0, y - targetVisibleY);

                scrollViewRef.current.scrollTo({
                  y: scrollAmount,
                  animated: true
                });
              }

              // Trigger re-measure after scroll animation
              setTimeout(() => {
                reMeasure();
              }, 800);
            } else {
              Logger.warn('[HomeScreen] Invalid measurement for:', key);
              reMeasure();
            }
          });
        }, 200);
      } else {
        Logger.warn('[HomeScreen] Ref not found or no measureInWindow for:', key);
        // Retry after a delay in case ref wasn't registered yet
        setTimeout(() => {
          if (localRefs.current[key]) {
            reMeasure();
          }
        }, 500);
      }
    }
  }, [isWalkthroughActive, currentStep, reMeasure, isLargeScreen]);

  // Helper to capture refs
  const captureRef = (key, ref) => {
    if (ref) {
      registerTarget(key, ref);
      localRefs.current[key] = ref;
    }
  };

  // Fallback: Check user profile for weekly completion (real-time sync)
  // This handles the case where API might be slow or cached, but Firestore profile is updated
  useEffect(() => {
    if (userProfile?.weeklyCompletedDays && userProfile.weeklyCompletedWeekId) {
      const now = new Date();
      const day = now.getUTCDay();
      const currentDayId = day === 0 ? 7 : day;

      // Calculate current week ID (Monday)
      const daysToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - daysToMonday);
      monday.setUTCHours(0, 0, 0, 0);
      const currentWeekId = monday.toISOString().split('T')[0];

      if (userProfile.weeklyCompletedWeekId === currentWeekId) {
        if (userProfile.weeklyCompletedDays.includes(currentDayId)) {
          // Only log if we're changing state to avoid spam
          if (!weeklyChallengeCompleted) {
            Logger.log('[HOME] Detected weekly completion from user profile');
            setWeeklyChallengeCompleted(true);
            AsyncStorage.setItem(WEEKLY_CACHE_KEY, 'true');
          }
        }
      }
    }
  }, [userProfile, WEEKLY_CACHE_KEY, weeklyChallengeCompleted]);

  // Refresh daily challenge status and interview stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      // Check and reset daily limits based on UTC date (sync, safe)
      loadSpeedSwipeData();
      loadRoastModeData();

      if (user?.uid) {
        // Async data refresh with cancellation support to prevent deadlock
        const refreshData = async () => {
          try {
            // Prioritize critical challenge data first (sequential to reduce race conditions)
            await prefetchDailyChallenge();
            if (isCancelled) return;

            await prefetchWeeklyChallengeStatus();
            if (isCancelled) return;

            // Secondary data (non-blocking, can run in parallel)
            if (!isCancelled) {
              fetchInterviewStats();
              checkPendingWeeklyReward();
              checkPendingDailyReward();
              loadXpBoostStatus();
            }
          } catch (error) {
            if (!isCancelled) {
              Logger.error('[HOME] Error refreshing data on focus:', error);
            }
          }
        };

        refreshData();
        if (fetchDueCards) fetchDueCards();
      }

      // Cleanup: cancel pending operations when screen loses focus
      return () => {
        isCancelled = true;
        // Abort any in-flight network requests
        if (dailyFetchControllerRef.current) {
          dailyFetchControllerRef.current.abort();
          dailyFetchControllerRef.current = null;
        }
        if (weeklyFetchControllerRef.current) {
          weeklyFetchControllerRef.current.abort();
          weeklyFetchControllerRef.current = null;
        }
      };
    }, [user?.uid, fetchDueCards])
  );

  const fetchInterviewStats = async () => {
    try {
      const daily = await interviewService.getDailyInterviewCount();
      const extra = await interviewService.getExtraInterviews();
      setDailyInterviews(daily);
      setExtraInterviews(extra);
    } catch (error) {
      Logger.error('Failed to fetch interview stats', error);
    }
  };

  const loadAdWatchData = async () => {
    try {
      const todayUTC = getUTCDateString();
      const storedDate = await AsyncStorage.getItem('adWatchDate');
      const storedChatAds = await AsyncStorage.getItem('chatAdsWatchedToday');

      if (storedDate === todayUTC) {
        setChatAdsWatchedToday(parseInt(storedChatAds) || 0);
      } else {
        setChatAdsWatchedToday(0);
      }
    } catch (error) {
      Logger.error('Error loading ad data', error);
    }
  };

  const loadSpeedSwipeData = async () => {
    try {
      const todayUTC = getUTCDateString();
      const storedDate = await AsyncStorage.getItem('speedSwipeDate');
      const storedCount = await AsyncStorage.getItem('speedSwipePlayedToday');

      if (storedDate === todayUTC) {
        setSpeedSwipePlayedToday(parseInt(storedCount) || 0);
      } else {
        setSpeedSwipePlayedToday(0);
        AsyncStorage.setItem('speedSwipeDate', todayUTC);
        AsyncStorage.setItem('speedSwipePlayedToday', '0');
      }
    } catch (error) {
      Logger.error('Error loading speed swipe data', error);
    }
  };

  const incrementSpeedSwipeCount = () => {
    setSpeedSwipePlayedToday(prev => {
      const newVal = prev + 1;
      AsyncStorage.setItem('speedSwipePlayedToday', newVal.toString());
      AsyncStorage.setItem('speedSwipeDate', getUTCDateString());
      return newVal;
    });
  };

  // ===== ROAST MODE DATA LOADING =====
  const loadRoastModeData = async () => {
    try {
      const todayUTC = getUTCDateString();
      const storedDate = await AsyncStorage.getItem('roastModeDate');
      const storedUsed = await AsyncStorage.getItem('roastModeUsedToday');

      if (storedDate === todayUTC) {
        setRoastModeUsedToday(storedUsed === 'true');
      } else {
        setRoastModeUsedToday(false);
        AsyncStorage.setItem('roastModeDate', todayUTC);
        AsyncStorage.setItem('roastModeUsedToday', 'false');
      }
    } catch (error) {
      Logger.error('Error loading roast mode data', error);
    }
  };

  // ===== XP BOOST STATUS LOADING =====
  const loadXpBoostStatus = async () => {
    try {
      if (!user?.uid) return;
      const userDoc = await firebaseService.getUserProfile(user.uid);
      const buffs = userDoc?.activeBuffs || {};

      if (buffs.xpMultiplierUntil) {
        const expiresAt = buffs.xpMultiplierUntil?.toDate?.() || new Date(buffs.xpMultiplierUntil);
        if (expiresAt > new Date()) {
          setXpBoostActive(true);
          setXpBoostExpiresAt(expiresAt);
        } else {
          setXpBoostActive(false);
          setXpBoostExpiresAt(null);
        }
      } else {
        setXpBoostActive(false);
        setXpBoostExpiresAt(null);
      }
    } catch (error) {
      Logger.error('Error loading XP boost status', error);
    }
  };

  // XP Boost countdown timer
  useEffect(() => {
    if (!xpBoostActive || !xpBoostExpiresAt) {
      setXpBoostCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = xpBoostExpiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setXpBoostActive(false);
        setXpBoostExpiresAt(null);
        setXpBoostCountdown('');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setXpBoostCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [xpBoostActive, xpBoostExpiresAt]);

  const markRoastModeUsed = () => {
    setRoastModeUsedToday(true);
    AsyncStorage.setItem('roastModeUsedToday', 'true');
    AsyncStorage.setItem('roastModeDate', getUTCDateString());
  };

  const handleRoastModePress = async () => {
    Logger.info('[ROAST_MODE] handleRoastModePress called');
    Haptics.heavy();
    const langValues = LANGUAGES ? Object.values(LANGUAGES) : [];
    const language = langValues.find((lang) => lang.code === selectedLanguage);
    Logger.info('[ROAST_MODE] Language selected:', { selectedLanguage, languageFound: !!language });

    // Helper function to navigate with conversation resume support
    const navigateToRoast = async () => {
      // Check for active conversation to resume
      let existingConversationId = null;
      if (user?.uid) {
        try {
          const checkLimit = isPro() ? 50 : 15;
          const activeConv = await firebaseService.getActiveConversation(user.uid, 'roast_mode', language.code, checkLimit);
          if (activeConv) {
            existingConversationId = activeConv.id;
            Logger.info('[ROAST_MODE] Resuming active conversation:', existingConversationId);
          }
        } catch (err) {
          Logger.warn('[ROAST_MODE] Failed to check active conversation:', err);
        }
      }

      navigation.navigate('Chat', {
        scenarioId: 'roast_mode',
        language,
        conversationId: existingConversationId,
      });
    };

    // Premium users: unlimited access
    if (isPro()) {
      Logger.info('[ROAST_MODE] User is Pro - navigating directly');
      await navigateToRoast();
      return;
    }

    Logger.info('[ROAST_MODE] Free user - checking roastModeUsedToday:', roastModeUsedToday);

    // Free users: 1 free play per day via watching ad, then premium required
    if (roastModeUsedToday) {
      Logger.info('[ROAST_MODE] Already used today - showing premium alert');
      showAlert(
        '🔥 Premium Feature',
        'You\'ve already used your free Roast My Accent session today! Upgrade to Premium for unlimited access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    // First play today - show ad first
    const adAvailable = rewardedAdService.isAdReady('ROAST');
    Logger.info('[ROAST_MODE] Ad availability check:', { adAvailable });

    if (!adAvailable) {
      Logger.info('[ROAST_MODE] Ad not ready - loading ad');
      rewardedAdService.loadAd('ROAST');
      showAlert('Ad Loading', 'Please wait a moment for the ad to load.');
      return;
    }

    Logger.info('[ROAST_MODE] Showing ad...');
    try {
      const success = await rewardedAdService.showAd(
        'ROAST',
        async (reward) => {
          Logger.info('[ROAST_MODE] Ad reward callback fired!', { reward });
          markRoastModeUsed();
          Logger.info('[ROAST_MODE] Marked as used, navigating to Chat...');
          await navigateToRoast();
          Logger.info('[ROAST_MODE] Navigation called successfully');
        },
        () => {
          Logger.info('[ROAST_MODE] Ad closed callback fired');
        },
        (err) => {
          Logger.error('[ROAST_MODE] Ad error callback:', err);
          showAlert('Ad Error', 'Failed to load ad.');
        }
      );
      Logger.info('[ROAST_MODE] showAd returned:', { success });
    } catch (error) {
      Logger.error('[ROAST_MODE] Exception in showAd:', error);
    }
  };

  const handleSpeedSwipePress = async () => {
    Haptics.heavy();

    // Check limits
    if (speedSwipePlayedToday >= SPEED_SWIPE_TOTAL_LIMIT) {
      showAlert('Daily Limit Reached', 'You have reached the maximum of 5 Blitz games for today. Come back tomorrow!');
      return;
    }

    // Free Play
    if (speedSwipePlayedToday < SPEED_SWIPE_FREE_LIMIT) {
      incrementSpeedSwipeCount();
      navigation.navigate('SpeedSwipe');
      return;
    }

    // Ad-Locked Play
    const adAvailable = rewardedAdService.isAdReady('BLITZ'); // Synchronous check first
    if (!adAvailable) {
      // Try to load if not ready, but show alert
      rewardedAdService.loadAd('BLITZ');
      showAlert('Ad Loading', 'Please wait a moment for the ad to load.');
      return;
    }

    const success = await rewardedAdService.showAd(
      'BLITZ',
      (reward) => {
        incrementSpeedSwipeCount();
        navigation.navigate('SpeedSwipe');
      },
      () => { }, // onClose
      (err) => showAlert('Ad Error', 'Failed to load ad.')
    );
  };

  const prefetchDailyChallenge = async () => {
    // Abort any previous in-flight request
    if (dailyFetchControllerRef.current) {
      dailyFetchControllerRef.current.abort();
    }
    dailyFetchControllerRef.current = new AbortController();

    try {
      const preferredLang = userProfile?.nativeLanguage;
      const nativeLanguage = (typeof preferredLang === 'object' ? preferredLang?.code : preferredLang) || 'en';

      const response = await fetch(
        `${BACKEND_URL}/api/daily/challenge?nativeLanguage=${nativeLanguage}&userId=${user?.uid}`,
        {
          headers: { 'x-client-secret': APP_CLIENT_SECRET },
          signal: dailyFetchControllerRef.current.signal
        }
      );

      Logger.info('[HOME_DEBUG] Prefetch response status:', response.status);

      // 403 means already completed today
      if (response.status === 403) {
        Logger.info('[HOME_DEBUG] Challenge already completed (403) - showing leaderboard button');
        setDailyChallengeCompleted(true);
        AsyncStorage.setItem(DAILY_CACHE_KEY, 'true'); // Cache the status
        return;
      }

      if (response.ok) {
        const data = await response.json();
        Logger.info('[HOME_DEBUG] Prefetch data:', { success: data.success, alreadyCompleted: data.alreadyCompleted });

        if (data.success) {
          setCachedChallenge(data);
          setDailyChallengeCompleted(false);
          AsyncStorage.setItem(DAILY_CACHE_KEY, 'false'); // Cache as not completed
        } else if (data.alreadyCompleted) {
          Logger.info('[HOME_DEBUG] Challenge already completed (flag) - showing leaderboard button');
          setDailyChallengeCompleted(true);
          AsyncStorage.setItem(DAILY_CACHE_KEY, 'true'); // Cache the status
        }
      }
    } catch (error) {
      // Silently ignore abort errors (expected during navigation)
      if (error.name === 'AbortError') return;
      Logger.error('[HOME_DEBUG] Prefetch error:', error);
    }
  };

  // Check if user has completed weekly puzzle
  const prefetchWeeklyChallengeStatus = async () => {
    // Abort any previous in-flight request
    if (weeklyFetchControllerRef.current) {
      weeklyFetchControllerRef.current.abort();
    }
    weeklyFetchControllerRef.current = new AbortController();

    try {
      Logger.log('[HOME] Prefetching weekly challenge status...');
      const response = await fetch(
        `${BACKEND_URL}/api/weekly/challenge?userId=${user?.uid}`,
        {
          headers: { 'x-client-secret': APP_CLIENT_SECRET },
          signal: weeklyFetchControllerRef.current.signal
        }
      );

      if (response.ok) {
        const data = await response.json();
        Logger.log('[HOME] Weekly challenge status response:', {
          success: data.success,
          completed: data.userProgress?.completed,
          foundWords: data.userProgress?.foundWords?.length,
          totalWords: data.wordCount
        });

        if (data.success && data.userProgress?.completed) {
          setWeeklyChallengeCompleted(true);
          AsyncStorage.setItem(WEEKLY_CACHE_KEY, 'true'); // Cache the status
        } else {
          setWeeklyChallengeCompleted(false);
          AsyncStorage.setItem(WEEKLY_CACHE_KEY, 'false'); // Cache as not completed
        }
      } else {
        Logger.warn('[HOME] Weekly challenge status failed:', response.status);
      }
    } catch (error) {
      // Silently ignore abort errors (expected during navigation)
      if (error.name === 'AbortError') return;
      Logger.error('[HOME] Weekly challenge status error:', error);
    }
  };

  // Check for pending weekly reward
  const checkPendingWeeklyReward = async () => {
    try {
      if (!user?.uid) return;

      const userDoc = await firebaseService.getUserProfile(user.uid);
      if (userDoc?.pendingWeeklyReward) {
        setPendingWeeklyReward(userDoc.pendingWeeklyReward);
        setShowWinnerModal(true);
      }
    } catch (error) {
      Logger.error('[HOME] Pending reward check error:', error);
    }
  };

  // Check for pending daily reward
  const checkPendingDailyReward = async () => {
    try {
      if (!user?.uid) return;

      const userDoc = await firebaseService.getUserProfile(user.uid);
      if (userDoc?.pendingDailyReward) {
        // Convert daily reward format to modal-compatible format
        const dailyReward = {
          weekId: userDoc.pendingDailyReward.date, // Use date as weekId for display
          rank: userDoc.pendingDailyReward.rank,
          gems: userDoc.pendingDailyReward.gems,
          tier: userDoc.pendingDailyReward.tier,
          icon: userDoc.pendingDailyReward.icon,
          title: userDoc.pendingDailyReward.title,
          score: userDoc.pendingDailyReward.score,
          awardedAt: userDoc.pendingDailyReward.awardedAt,
          isDaily: true, // Flag to distinguish from weekly
        };
        setPendingDailyReward(dailyReward);
        setShowDailyWinnerModal(true);
      }
    } catch (error) {
      Logger.error('[HOME] Pending daily reward check error:', error);
    }
  };

  // Claim weekly reward - close modal and clear from database
  const handleClaimWeeklyReward = async () => {
    try {
      setShowWinnerModal(false);
      setPendingWeeklyReward(null);

      // Clear from backend
      if (user?.uid) {
        await fetch(`${BACKEND_URL}/api/weekly/clear-reward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET
          },
          body: JSON.stringify({ userId: user.uid })
        });
      }
    } catch (error) {
      Logger.error('[HOME] Clear reward error:', error);
    }
  };

  // Claim daily reward - close modal and clear from database
  const handleClaimDailyReward = async () => {
    try {
      setShowDailyWinnerModal(false);
      setPendingDailyReward(null);

      // Clear pendingDailyReward from user document
      if (user?.uid) {
        await firebaseService.updateUserProfile(user.uid, {
          pendingDailyReward: null
        });
      }
    } catch (error) {
      Logger.error('[HOME] Clear daily reward error:', error);
    }
  };

  const handleScenarioPress = async (scenario) => {
    const langValues = LANGUAGES ? Object.values(LANGUAGES) : [];
    const language = langValues.find((lang) => lang.code === selectedLanguage);

    // Check for active conversation to resume FIRST
    let existingConversationId = null;
    let shouldResume = false;

    if (user?.uid) {
      try {
        // Determine limit for checking active conversation
        // Pro: 50, Free: 15 (10 base + 5 extra)
        const checkLimit = isPro() ? 50 : 15;

        const activeConv = await firebaseService.getActiveConversation(user.uid, scenario.id, language.code, checkLimit);
        if (activeConv) {
          existingConversationId = activeConv.id;
          shouldResume = true;
          Logger.info('Resuming active conversation:', existingConversationId);
        }
      } catch (err) {
        Logger.warn('Failed to check active conversation:', err);
      }
    }

    // If NOT resuming an existing conversation, check daily scenario limits
    if (!shouldResume) {
      const totalLimit = getDailyLimit() + extraChats;

      if (!isPro() && dailyUsage >= totalLimit) {
        // Show unified modal if daily usage exceeded
        setSelectedScenarioIdForAd(scenario.id);
        setShowLimitModal(true);
        return;
      }
    }

    navigation.navigate('Chat', {
      scenarioId: scenario.id,
      language,
      conversationId: existingConversationId
    });
  };

  const handleWatchChatAd = async () => {
    try {
      const success = await rewardedAdService.showAd(
        'EXTRA_SCENARIO',
        (reward) => {
          earnExtraChats(1);
          setChatAdsWatchedToday(prev => {
            const v = prev + 1;
            AsyncStorage.setItem('chatAdsWatchedToday', v.toString());
            return v;
          });
          setShowLimitModal(false);
          showAlert('Success', 'You unlocked 1 extra conversation!');

          if (selectedScenarioIdForAd) {
            const langValues = LANGUAGES ? Object.values(LANGUAGES) : [];
            const language = langValues.find((lang) => lang.code === selectedLanguage);
            navigation.navigate('Chat', {
              scenarioId: selectedScenarioIdForAd,
              language
            });
            setSelectedScenarioIdForAd(null);
          }
        },
        () => { },
        (err) => showAlert('Ad Error', 'Ad not available.')
      );
      if (!success) showAlert('Loading', 'Please wait for ad to load.');
    } catch (e) {
      Logger.error(e);
    }
  };

  const handleUpgrade = () => {
    setShowLimitModal(false);
    navigation.navigate('Subscription');
  };

  const totalDailyLimit = getDailyLimit() + extraChats;
  const usagePercentage = Math.min((dailyUsage / totalDailyLimit) * 100, 100);

  const allLanguages = LANGUAGES ? Object.values(LANGUAGES) : [];
  let sortedLanguages = [];
  const preferredLanguageData = allLanguages.find(lang => lang.code === userProfile?.preferredLanguage);

  if (preferredLanguageData) {
    sortedLanguages.push(preferredLanguageData);
    sortedLanguages = sortedLanguages.concat(
      allLanguages.filter(lang => lang.code !== userProfile?.preferredLanguage)
    );
  } else {
    sortedLanguages = allLanguages;
  }

  // Filter out ROAST_MODE since it's accessed via dedicated navigation card
  const scenarioList = SCENARIOS ? Object.values(SCENARIOS).filter(s => s.id !== 'roast_mode') : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* 1. CURVED HEADER BACKGROUND */}
      <View style={[
        styles.headerBackgroundContainer,
        isSmallScreen && { height: 220 },
        isMediumScreen && { height: 260 }
      ]}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* 2. TOP APP BAR - Redesigned for all screen sizes */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
          {/* Header Left: Avatar + Badge Pill */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
              style={[
                styles.profileCircle,
                hasGoldFrame && {
                  borderColor: '#FFD700',
                  borderWidth: 2,
                  shadowColor: '#FFD700',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                  elevation: 5
                }
              ]}
            >
              {(() => {
                const equippedAvatarId = userProfile?.equippedAvatar;
                const AVATAR_IMAGES = {
                  'avatar_gecko': require('../../assets/avatars/gecko.png'),
                  'avatar_chameleon': require('../../assets/avatars/chameleon.png'),
                  'avatar_dragon': require('../../assets/avatars/dragon-b.png'),
                  'avatar_axolotl': require('../../assets/avatars/axolotil.png'),
                  'avatar_mascott': require('../../assets/avatars/mascott.png'),
                  'avatar_speedy': require('../../assets/avatars/speedy_lizard.png'),
                };
                const avatarImage = AVATAR_IMAGES[equippedAvatarId];

                if (avatarImage) {
                  return (
                    <Image
                      source={avatarImage}
                      style={styles.profileAvatarImage}
                      resizeMode="cover"
                    />
                  );
                }

                return userProfile?.photoURL ? (
                  <Text style={{ fontSize: 18, color: '#FFF' }}>
                    {userProfile.name?.[0]?.toUpperCase()}
                  </Text>
                ) : (
                  <Icon name="account-circle" size={34} color="rgba(255,255,255,0.9)" />
                );
              })()}
            </TouchableOpacity>

            {/* TABLET LAYOUT vs MOBILE LAYOUT */}
            {isLargeScreen ? (
              /* TABLET: All badges right-aligned */
              <View style={styles.tabletHeaderRight}>
                <InventoryBadge onPress={() => navigation.navigate('Inventory')} />
                <LeaderboardBadge onPress={() => navigation.navigate('Leaderboards')} />
                <MapBadge onPress={() => navigation.navigate('WeeklyGame', { viewMode: 'map' })} />
                <GemBadge onPress={() => navigation.navigate('Shop')} />
                <View
                  ref={(ref) => captureRef('streak-badge', ref)}
                  collapsable={false}
                >
                  <StreakBadge onPress={() => setShowStreakModal(true)} />
                </View>
              </View>
            ) : (
              <>
                {/* MOBILE: Center-Left Expandable Badge Pill */}
                <View style={[styles.badgePillWrapper, isPillExpanded && { zIndex: 10 }]}>
                  <BadgePillContainer
                    onInventoryPress={() => navigation.navigate('Inventory')}
                    onLeaderboardPress={() => navigation.navigate('Leaderboards')}
                    onMapPress={() => navigation.navigate('WeeklyGame', { viewMode: 'map' })}
                    onGemPress={() => navigation.navigate('Shop')}
                    onStreakPress={() => setShowStreakModal(true)}
                    onExpandChange={(expanded) => {
                      setIsPillExpanded(expanded);
                      // Hide badges completely when pill expands (animate opacity)
                      Animated.timing(badgeScaleAnim, {
                        toValue: expanded ? 0 : 1,
                        duration: 200,
                        easing: Easing.bezier(0.4, 0, 0.2, 1),
                        useNativeDriver: true,
                      }).start();
                    }}
                  />
                </View>

                {/* MOBILE: Right Currency Badges - Hidden when pill expands */}
                <Animated.View
                  style={[
                    styles.currencyBadgesContainer,
                    { opacity: badgeScaleAnim }
                  ]}
                  pointerEvents={isPillExpanded ? 'none' : 'auto'}
                >
                  <GemBadge onPress={() => navigation.navigate('Shop')} />
                  <View
                    ref={(ref) => captureRef('streak-badge', ref)}
                    collapsable={false}
                  >
                    <StreakBadge onPress={() => setShowStreakModal(true)} />
                  </View>
                </Animated.View>
              </>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          onMomentumScrollEnd={() => {
            if (isWalkthroughActive) reMeasure();
          }}
          onScrollEndDrag={() => {
            if (isWalkthroughActive) reMeasure();
          }}
          scrollEventThrottle={16}
        >
          {/* 3. FLOATING STATS CARD WITH GLASSMORPHISM */}
          <GlassContainer
            style={[
              styles.statsCard,
              { flexDirection: isPro() ? 'row' : 'row', padding: isSmallScreen ? 12 : 16 },
              isSmallScreen && { marginBottom: 16, marginHorizontal: 16 },
              isMediumScreen && { marginBottom: 20 },
              isCyberpunk && {
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }
            ]}
            intensity={25}
            tinted={false}
          >
            {isPro() ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Icon name="all-inclusive" size={32} color="#FFD700" />
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary, fontWeight: '600' }]}>Unlimited Access</Text>
                </View>
              </View>
            ) : (
              <>
                {/* DAILY CHATS */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.iconCircleBg, { backgroundColor: isDarkMode ? '#333' : '#F3E5F5', marginRight: 0, marginBottom: 8 }]}>
                      <Icon name="message-text" size={22} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text, fontSize: 22, marginBottom: 2 }]}>{dailyUsage}/{totalDailyLimit}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11 }]}>Daily Chats</Text>
                  </View>
                  <View style={[styles.miniProgressContainer, { position: 'relative', width: '80%', marginTop: 4, height: 6, borderRadius: 3, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <LinearGradient
                      colors={COLORS.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${usagePercentage}%`, borderRadius: 3 }}
                    />
                  </View>
                </View>

                {/* DIVIDER */}
                <View style={{ width: 1, height: '80%', backgroundColor: colors.border, marginHorizontal: 8, alignSelf: 'center' }} />

                {/* INTERVIEWS */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.iconCircleBg, { backgroundColor: isDarkMode ? '#333' : '#E3F2FD', marginRight: 0, marginBottom: 8 }]}>
                      <Icon name="briefcase" size={22} color="#2196F3" />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.statValue, { color: colors.text, fontSize: 22, marginBottom: 2 }]}>
                        {dailyInterviews}/{1 + (extraInterviews || 0)}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 11 }]}>Interviews</Text>
                  </View>
                  <View style={[styles.miniProgressContainer, { position: 'relative', width: '80%', marginTop: 4, height: 6, borderRadius: 3, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <LinearGradient
                      colors={['#2196F3', '#64B5F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: '100%', width: `${Math.min((dailyInterviews / (1 + (extraInterviews || 0))) * 100, 100)}%`, borderRadius: 3 }}
                    />
                  </View>
                </View>
              </>
            )}
          </GlassContainer>

          {/* XP BOOST ACTIVE CARD - Shows when XP Potion is active */}
          {xpBoostActive && (
            <FadeInView duration={400} delay={0}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('SpeedSwipe')}
                style={[
                  styles.xpBoostCard,
                  isSmallScreen && { marginHorizontal: 16, marginBottom: 12 }
                ]}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.xpBoostGradient}
                >
                  {/* Animated glow effect */}
                  <View style={styles.xpBoostGlow} />

                  <View style={styles.xpBoostContent}>
                    {/* Potion icon with pulse */}
                    <PulseView duration={1500} minScale={0.95} maxScale={1.05}>
                      <View style={styles.xpBoostIconContainer}>
                        <Icon name="flask" size={28} color="#FFF" />
                        <Text style={styles.xpBoostMultiplier}>2×</Text>
                      </View>
                    </PulseView>

                    {/* Text content */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.xpBoostTitle}>⚡ XP BOOST ACTIVE</Text>
                      <Text style={styles.xpBoostSubtitle}>
                        Earn double XP from games!
                      </Text>
                    </View>

                    {/* Countdown timer */}
                    <View style={styles.xpBoostTimer}>
                      <Icon name="timer" size={16} color="#FCD34D" />
                      <Text style={styles.xpBoostTimerText}>{xpBoostCountdown}</Text>
                    </View>
                  </View>

                  {/* Action hint */}
                  <View style={styles.xpBoostAction}>
                    <Text style={styles.xpBoostActionText}>Tap to play Speed Swipe →</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          )}

          {/* SPECIAL CHALLENGE: Roast My Accent */}
          <FadeInView duration={500} delay={50}>
            <AnimatedButton
              style={[
                styles.roastModeCard,
                isSmallScreen && { marginHorizontal: 16, marginBottom: 12 }
              ]}
              onPress={handleRoastModePress}
              hapticType={null}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={['#FF512F', '#F09819']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.roastModeGradient,
                  isSmallScreen && { padding: 12 }
                ]}
              >
                <View style={styles.roastModeContent}>
                  <Icon
                    name="fire"
                    size={isSmallScreen ? 26 : 32}
                    color="#FFF"
                    style={{ marginRight: isSmallScreen ? 10 : 14 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.roastModeTitle,
                      isSmallScreen && { fontSize: 15 }
                    ]}>Roast My Accent</Text>
                    <Text style={[
                      styles.roastModeSubtitle,
                      isSmallScreen && { fontSize: 10 }
                    ]}>
                      Get roasted while learning!
                    </Text>
                  </View>
                  <View style={[
                    styles.roastModeArrow,
                    isSmallScreen && { width: 28, height: 28, borderRadius: 14 }
                  ]}>
                    <Icon name="chevron-right" size={isSmallScreen ? 20 : 24} color="#FF512F" />
                  </View>
                </View>
              </LinearGradient>
            </AnimatedButton>
          </FadeInView>


          {/* SPEED SWIPE: Blitz Mode */}
          <FadeInView duration={500} delay={75}>
            <AnimatedButton
              style={[
                styles.roastModeCard,
                isSmallScreen && { marginHorizontal: 16, marginBottom: 12 },
                { marginTop: 12 }
              ]}
              onPress={handleSpeedSwipePress}
              hapticType={null}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.roastModeGradient,
                  isSmallScreen && { padding: 12 }
                ]}
              >
                <View style={styles.roastModeContent}>
                  <Icon
                    name="flash"
                    size={isSmallScreen ? 26 : 32}
                    color="#FFD700"
                    style={{ marginRight: isSmallScreen ? 10 : 14 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.roastModeTitle,
                      isSmallScreen && { fontSize: 15 }
                    ]}>Speed Swipe Blitz</Text>
                    <Text style={[
                      styles.roastModeSubtitle,
                      isSmallScreen && { fontSize: 10 }
                    ]}>
                      {speedSwipePlayedToday < SPEED_SWIPE_FREE_LIMIT
                        ? 'Free Play Available!'
                        : speedSwipePlayedToday < SPEED_SWIPE_TOTAL_LIMIT
                          ? 'Watch Ad to Play'
                          : 'Daily Limit Reached'}
                    </Text>
                    {/* Progress Circles - Only show if limit not reached */}
                    {speedSwipePlayedToday < SPEED_SWIPE_TOTAL_LIMIT && (
                      <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                        {[...Array(SPEED_SWIPE_TOTAL_LIMIT)].map((_, index) => (
                          <View
                            key={index}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: index < speedSwipePlayedToday ? '#4ADE80' : 'transparent',
                              borderWidth: 1.5,
                              borderColor: index < speedSwipePlayedToday ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={[
                    styles.roastModeArrow,
                    isSmallScreen && { width: 28, height: 28, borderRadius: 14 }
                  ]}>
                    <Icon name={speedSwipePlayedToday < SPEED_SWIPE_FREE_LIMIT ? "chevron-right" : "play-circle"} size={isSmallScreen ? 20 : 24} color="#4F46E5" />
                  </View>
                </View>
              </LinearGradient>
            </AnimatedButton>
          </FadeInView>

          {/* DOUBLE OR NOTHING: Streak Wager */}
          <FadeInView duration={500} delay={100}>
            <View style={{ marginHorizontal: isSmallScreen ? 16 : 20, marginBottom: 12 }}>
              <WagerCard />
            </View>
          </FadeInView>

          {/* Review Vocabulary Button */}
          {dueCards && dueCards.length > 0 && (
            <PulseView enabled={true}>
              <AnimatedButton
                style={[
                  styles.reviewButton,
                  isSmallScreen && { marginHorizontal: 16, marginBottom: 12 }
                ]}
                onPress={() => {
                  Haptics.medium();
                  navigation.navigate('ReviewSession');
                }}
                hapticType={null}
                scaleValue={0.97}
              >
                <LinearGradient
                  colors={COLORS.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.reviewGradient,
                    isSmallScreen && { padding: 12 }
                  ]}
                >
                  <View style={styles.reviewContent}>
                    <Icon name="book-open-page-variant" size={isSmallScreen ? 22 : 28} color="#FFF" style={{ marginRight: isSmallScreen ? 8 : 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.reviewTitle,
                        isSmallScreen && { fontSize: 14 }
                      ]}>Review Vocabulary</Text>
                      <Text style={[
                        styles.reviewSubtitle,
                        isSmallScreen && { fontSize: 10 }
                      ]}>
                        {dueCards.length} {dueCards.length === 1 ? 'card' : 'cards'} due
                      </Text>
                    </View>
                    <View style={[
                      styles.reviewArrow,
                      isSmallScreen && { width: 26, height: 26, borderRadius: 13 }
                    ]}>
                      <Icon name="chevron-right" size={isSmallScreen ? 20 : 24} color="#FFF" />
                    </View>
                  </View>
                </LinearGradient>
              </AnimatedButton>
            </PulseView>
          )}

          {/* Daily Word Game / Weekly Puzzle Button - Hide when loading (null), or when both completed */}
          {dailyChallengeCompleted !== null && weeklyChallengeCompleted !== null &&
            !(dailyChallengeCompleted && weeklyChallengeCompleted) && (
              <FadeInView duration={600} delay={100}>
                <View
                  ref={(ref) => captureRef('daily-challenge-card', ref)}
                  collapsable={false}
                >
                  <AnimatedButton
                    style={[
                      styles.dailyGameButton,
                      isSmallScreen && { marginHorizontal: 16, marginBottom: 12 }
                    ]}
                    onPress={() => {
                      Haptics.medium();
                      if (!dailyChallengeCompleted) {
                        // Step 1: Play Daily Challenge
                        navigation.navigate('DailyGame', {
                          targetLanguage: selectedLanguage,
                          cachedData: cachedChallenge
                        });
                      } else if (!weeklyChallengeCompleted) {
                        // Step 2: Play Weekly Puzzle
                        navigation.navigate('WeeklyGame');
                      }
                    }}
                    hapticType={null}
                    scaleValue={0.97}
                  >
                    <LinearGradient
                      colors={
                        !dailyChallengeCompleted ? ['#C738BD', '#8E54E9'] :
                          ['#4A90D9', '#2E5A8B']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.dailyGameGradient,
                        isSmallScreen && { padding: 12 }
                      ]}
                    >
                      <View style={styles.dailyGameContent}>
                        <Icon
                          name={!dailyChallengeCompleted ? "gamepad-variant" : "puzzle"}
                          size={isSmallScreen ? 22 : 28}
                          color="#FFF"
                          style={{ marginRight: isSmallScreen ? 8 : 12 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.dailyGameTitle,
                            isSmallScreen && { fontSize: 14 }
                          ]}>
                            {!dailyChallengeCompleted ? "Daily Word Match" : "Weekly Word Puzzle"}
                          </Text>
                          <Text style={[
                            styles.dailyGameSubtitle,
                            isSmallScreen && { fontSize: 10 }
                          ]}>
                            {!dailyChallengeCompleted ? "Match words with meanings!" : "Find hidden words! ✨"}
                          </Text>
                        </View>
                        <View style={[
                          styles.dailyGameArrow,
                          isSmallScreen && { width: 26, height: 26, borderRadius: 13 }
                        ]}>
                          <Icon name="chevron-right" size={isSmallScreen ? 20 : 24} color="#FFF" />
                        </View>
                      </View>
                      {/* Countdown Timer Overlay - Always show */}
                      <View style={styles.countdownOverlay}>
                        <Text style={[
                          styles.countdownTime,
                          isSmallScreen && { fontSize: 24 },
                          isMediumScreen && { fontSize: 32 }
                        ]}>{resetCountdown}</Text>
                      </View>
                    </LinearGradient>
                  </AnimatedButton>
                </View>
              </FadeInView>
            )}

          {/* Interview Practice Button */}
          <FadeInView duration={600} delay={150}>
            <AnimatedButton
              style={[
                styles.interviewButton,
                isSmallScreen && { marginHorizontal: 16, marginBottom: 12 }
              ]}
              onPress={async () => {
                Haptics.medium();

                // Pro users always go to setup (can choose topic, resume if same)
                if (isPro()) {
                  navigation.navigate('InterviewSetup');
                  return;
                }

                // Free users auto-resume if saved
                const saved = await interviewService.loadProgress();
                if (saved) {
                  navigation.navigate('Interview', {
                    category: saved.category,
                    topic: saved.topic,
                    difficulty: saved.difficulty,
                    language: saved.language
                  });
                } else {
                  navigation.navigate('InterviewSetup');
                }
              }}
              hapticType={null}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={['#2196F3', '#1565C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.interviewGradient,
                  isSmallScreen && { padding: 12 }
                ]}
              >
                <View style={styles.interviewContent}>
                  <Icon
                    name="briefcase-outline"
                    size={isSmallScreen ? 22 : 28}
                    color="#FFF"
                    style={{ marginRight: isSmallScreen ? 8 : 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.interviewTitle,
                      isSmallScreen && { fontSize: 14 }
                    ]}>Interview Practice</Text>
                    <Text style={[
                      styles.interviewSubtitle,
                      isSmallScreen && { fontSize: 10 }
                    ]}>
                      HR, Technical, System Design & more
                    </Text>
                  </View>
                  <View style={[
                    styles.interviewArrow,
                    isSmallScreen && { width: 26, height: 26, borderRadius: 13 }
                  ]}>
                    <Icon name="chevron-right" size={isSmallScreen ? 20 : 24} color="#FFF" />
                  </View>
                </View>
              </LinearGradient>
            </AnimatedButton>
          </FadeInView>

          {/* 4. LANGUAGE SELECTOR */}
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageScroll}
            >
              {sortedLanguages.map((language) => {
                const isSelected = selectedLanguage === language.code;
                return (
                  <TouchableOpacity
                    key={language.code}
                    activeOpacity={0.7}
                    style={[
                      styles.langPill,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && styles.langPillSelected,
                      isCyberpunk && { borderColor: isSelected ? colors.primary : colors.border, borderWidth: 1 }
                    ]}
                    onPress={() => setSelectedLanguage(language.code)}
                  >
                    <Text style={styles.langFlag}>{language.flag}</Text>
                    <Text style={[
                      styles.langName,
                      { color: colors.text },
                      isSelected && styles.langNameSelected
                    ]}>
                      {language.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 5. SCENARIO GRID */}
          <View style={styles.section}>
            <View style={styles.gridContainer}>
              {scenarioList.map((scenario, index) => {
                const imageSource = SCENARIO_IMAGES[scenario.id];
                // Check if scenario is locked (not free and not owned)
                const isLocked = scenario.packId && scenario.packId !== 'free' && !ownedPacks[scenario.packId] && !isPro();
                // Register first unlocked scenario for walkthrough
                const isFirstUnlocked = index === 0 || (!isLocked && scenarioList.slice(0, index).every(s =>
                  s.packId && s.packId !== 'free' && !ownedPacks[s.packId] && !isPro()
                ));

                return (
                  <ScaleIn
                    key={scenario.id}
                    delay={index * 50}
                    style={styles.cardContainer}
                  >
                    <View
                      ref={isFirstUnlocked && !isLocked ? (ref) => captureRef('scenario-card', ref) : undefined}
                      collapsable={false}
                    >
                      <AnimatedButton
                        onPress={() => {
                          Haptics.medium();
                          if (isLocked) {
                            // Show pack purchase modal with ad trial option
                            setSelectedLockedScenario(scenario);
                            setSelectedPackId(scenario.packId);
                            setShowPackModal(true);
                          } else {
                            handleScenarioPress(scenario);
                          }
                        }}
                        hapticType={null}
                        scaleValue={0.96}
                        style={styles.cardWrapper}
                      >
                        {imageSource ? (
                          <ImageBackground
                            source={imageSource}
                            style={styles.cardImageBg}
                            imageStyle={{ borderRadius: 20 }}
                            resizeMode="cover"
                          >
                            {isCyberpunk && <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: colors.border, borderRadius: 20 }]} />}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.8)']}
                              style={styles.cardGradientOverlay}
                            >
                              <Text style={styles.cardTitle} numberOfLines={2}>
                                {scenario.name}
                              </Text>
                            </LinearGradient>
                            {/* Lock Overlay */}
                            {isLocked && (
                              <View style={styles.lockOverlay}>
                                <Icon name="play-circle" size={40} color="#FFF" />
                                <Text style={styles.lockText}>Unlock</Text>
                              </View>
                            )}
                          </ImageBackground>
                        ) : (
                          <LinearGradient
                            colors={['#4c669f', '#3b5998', '#192f6a']}
                            style={[styles.cardImageBg, { justifyContent: 'center', alignItems: 'center', padding: 10 }]}
                          >
                            <Icon name="message-text-outline" size={32} color="rgba(255,255,255,0.7)" style={{ marginBottom: 10 }} />
                            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>
                              {scenario.name}
                            </Text>
                            {/* Lock Overlay for non-image cards */}
                            {isLocked && (
                              <View style={styles.lockOverlay}>
                                <Icon name="play-circle" size={40} color="#FFF" />
                                <Text style={styles.lockText}>Unlock</Text>
                              </View>
                            )}
                          </LinearGradient>
                        )}
                      </AnimatedButton>
                    </View>
                  </ScaleIn>
                );
              })}
            </View>
          </View>

          {/* 6. UPGRADE CTA */}
          {!isPro() && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Subscription')}
              style={styles.upgradeContainer}
            >
              <LinearGradient
                colors={['#8e52f2', '#6A11CB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Icon name="crown" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                    <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                  </View>
                  <Text style={styles.upgradeDesc}>
                    Get 100 daily chats, GPT-5 responses, Voice Chat, and more.
                  </Text>
                </View>
                <View style={styles.upgradeButton}>
                  <Icon name="arrow-right" size={20} color="#6A11CB" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      <PremiumLimitModal
        visible={showLimitModal}
        mode="EXTRA_SCENARIO"
        onClose={() => setShowLimitModal(false)}
        onUpgrade={handleUpgrade}
        onWatchAd={handleWatchChatAd}
        adsWatchedToday={chatAdsWatchedToday}
        maxAdsPerDay={MAX_ADS_PER_DAY}
      />

      <StreakDetailsModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={currentStreak || 0}
        userProfile={userProfile}
      />

      <PreferredLanguageModal
        visible={showPreferredLanguageModal}
        onClose={() => setShowPreferredLanguageModal(false)}
        nativeLanguage={userProfile?.nativeLanguage}
      />

      <WeeklyWinnerModal
        visible={showWinnerModal}
        reward={pendingWeeklyReward}
        onClaim={handleClaimWeeklyReward}
      />

      {/* Daily Winner Modal - reuses WeeklyWinnerModal component */}
      <WeeklyWinnerModal
        visible={showDailyWinnerModal}
        reward={pendingDailyReward}
        onClaim={handleClaimDailyReward}
      />

      {/* Scenario Pack Purchase Modal */}
      <PurchasePackModal
        visible={showPackModal}
        packId={selectedPackId}
        onClose={() => {
          setShowPackModal(false);
          setSelectedLockedScenario(null);
        }}
        onPurchase={(packId) => {
          Logger.info('[HOME] Pack purchased:', packId);
          setShowPackModal(false);
          setSelectedLockedScenario(null);
        }}
        onWatchAd={selectedLockedScenario ? async () => {
          const scenarioToAccess = selectedLockedScenario; // Capture before closing
          setShowPackModal(false);
          setSelectedLockedScenario(null);

          try {
            const adShown = await rewardedAdService.showAd(
              'EXTRA_SCENARIO',
              // onReward callback
              (reward) => {
                Logger.info('[HOME] Ad reward earned, granting trial access:', scenarioToAccess.id);
                handleScenarioPress(scenarioToAccess);
              },
              // onClose callback
              () => {
                Logger.info('[HOME] Ad closed');
              },
              // onError callback
              (error) => {
                Logger.error('[HOME] Ad error:', error);
              }
            );

            if (!adShown) {
              showAlert('Ad Not Ready', 'Please try again in a moment.');
            }
          } catch (error) {
            Logger.error('[HOME] Ad trial failed:', error);
            showAlert('Error', 'Failed to load ad. Please try again.');
          }
        } : null}
      />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  headerGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Quick navigation icons in the center of top bar
  quickNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: 8,
  },
  quickNavIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Expandable badge pill wrapper
  badgePillWrapper: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  // Currency badges on the right side of top bar
  currencyBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Header Left: Avatar + Pill
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Header Center: Centralized Badges
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'box-none', // Allow clicks pass through empty space
  },
  // Tablet header right container (Deprecated but keeping for safety if referenced elsewhere)
  tabletHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginRight: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsCard: {
    marginHorizontal: 20,
    // Background handled by GlassContainer
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadows now handled by GlassContainer
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircleBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  miniProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f0f0f0'
  },
  miniProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  section: {
    marginTop: 25,
  },
  languageScroll: {
    paddingHorizontal: 20,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Semi-transparent glass
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginRight: 12,
    shadowColor: '#6A11CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)', // Glass border
  },
  langPillSelected: {
    backgroundColor: 'rgba(106, 17, 203, 0.85)', // Semi-transparent purple
    elevation: 6,
    shadowColor: '#6A11CB',
    shadowOpacity: 0.4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  langFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  langName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  langNameSelected: {
    color: '#fff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (width - 60) / 2,
    marginBottom: 15,
    marginHorizontal: 5,
  },
  cardWrapper: {
    width: '100%',
  },
  cardImageBg: {
    width: '100%',
    height: 140, // EXPLICIT HEIGHT RESTORED
    justifyContent: 'flex-end',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradientOverlay: {
    padding: 12,
    justifyContent: 'flex-end',
    minHeight: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  lockText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  upgradeContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#8e52f2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  upgradeGradient: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  upgradeDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  reviewButton: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  reviewGradient: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  reviewSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  reviewArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyGameButton: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#C738BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dailyGameGradient: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dailyGameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dailyGameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  dailyGameSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  dailyGameArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownOverlay: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownTime: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0,
  },
  interviewButton: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  interviewGradient: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  interviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  interviewTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  interviewSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  interviewArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Collapsed Challenge Card Styles
  collapsedChallengeButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  collapsedChallengeText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  // Roast Mode Special Challenge Card Styles
  roastModeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF512F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roastModeGradient: {
    padding: 16,
    borderRadius: 20,
  },
  roastModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roastModeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  roastModeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  roastModeArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // XP Boost Card Styles
  xpBoostCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  xpBoostGradient: {
    padding: 16,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  xpBoostGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  xpBoostContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpBoostIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  xpBoostMultiplier: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FCD34D',
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  xpBoostTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  xpBoostSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  xpBoostTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  xpBoostTimerText: {
    color: '#FCD34D',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  xpBoostAction: {
    marginTop: 12,
    alignItems: 'center',
  },
  xpBoostActionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default HomeScreen; 
