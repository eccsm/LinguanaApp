// ============================================================================
// HYBRID ADMOB SERVICE - Works with or without package installed
// Automatically detects if react-native-google-mobile-ads is available
// Falls back to demo mode if package has issues
// ============================================================================

import { Platform, Alert } from 'react-native';
import Logger from '../utils/logger';

// Try to import AdMob, fall back to demo mode if it fails
let RewardedAd, RewardedAdEventType, AdEventType, TestIds;
let ADMOB_AVAILABLE = false;

try {
  const admob = require('react-native-google-mobile-ads');
  RewardedAd = admob.RewardedAd;
  RewardedAdEventType = admob.RewardedAdEventType;
  AdEventType = admob.AdEventType; // For CLOSED event
  TestIds = admob.TestIds;

  // Verify all imports are valid
  if (!RewardedAd || !RewardedAdEventType) {
    throw new Error('AdMob exports missing');
  }

  ADMOB_AVAILABLE = true;
  Logger.withCategory('ADS').info('✅ AdMob package loaded successfully', {
    hasRewardedAd: !!RewardedAd,
    hasRewardedEventType: !!RewardedAdEventType,
    hasAdEventType: !!AdEventType,
    rewardedEventTypes: Object.keys(RewardedAdEventType || {}),
    adEventTypes: Object.keys(AdEventType || {}),
  });
} catch (error) {
  ADMOB_AVAILABLE = false;
  Logger.withCategory('ADS').warn('⚠️ AdMob package not available, using demo mode', error);
}

// Ad Unit IDs for different reward types
// In __DEV__ mode, use Google's test ad IDs to ensure ads always load
// In production, use real ad unit IDs
const getAdUnitId = (iosId, androidId) => {
  if (!ADMOB_AVAILABLE) {
    return 'DEMO_AD';
  }

  // Use test IDs in development mode
  if (__DEV__) {
    return Platform.select({
      ios: TestIds?.REWARDED || 'ca-app-pub-3940256099942544/1712485313',
      android: TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917',
    });
  }

  // Use real IDs in production
  return Platform.select({
    ios: iosId,
    android: androidId,
  });
};

const AD_UNIT_IDS = {
  VOICE: getAdUnitId(
    'ca-app-pub-5060300106472726/8209912481',
    'ca-app-pub-5060300106472726/7821826877'
  ),
  CHAT: getAdUnitId(
    'ca-app-pub-5060300106472726/4710377526',
    'ca-app-pub-5060300106472726/3650477108'
  ),
  EXTRA_LIFE: getAdUnitId(
    'ca-app-pub-5060300106472726/5831887504',
    'ca-app-pub-5060300106472726/2588676870'
  ),
  EXTRA_SCENARIO: getAdUnitId(
    'ca-app-pub-5060300106472726/7089128851',
    'ca-app-pub-5060300106472726/9981023687'
  ),
  VOICE_REPLAY: getAdUnitId(
    'ca-app-pub-5060300106472726/9056816643',
    'ca-app-pub-5060300106472726/3533027222'
  ),
  INTERVIEW_LANGUAGE: getAdUnitId(
    'ca-app-pub-5060300106472726/9195691096',
    'ca-app-pub-5060300106472726/6451491141'
  ),
  HINT: getAdUnitId(
    'ca-app-pub-5060300106472726/9387949515',
    'ca-app-pub-5060300106472726/1999595848'
  ),
  PUZZLE_TIP: getAdUnitId(
    'ca-app-pub-5060300106472726/1999595848',
    'ca-app-pub-5060300106472726/9387949515'
  ),
  BLITZ: getAdUnitId(
    'ca-app-pub-5060300106472726/4595174873', // iOS
    'ca-app-pub-5060300106472726/9987102350'  // Android
  ),
  ROAST: getAdUnitId(
    'ca-app-pub-5060300106472726/4595174873', // iOS - using BLITZ ad unit for now
    'ca-app-pub-5060300106472726/9987102350'  // Android - using BLITZ ad unit for now
  ),
  DOUBLE_XP: getAdUnitId(
    'ca-app-pub-5060300106472726/4163574813', // iOS
    'ca-app-pub-5060300106472726/3803470405'  // Android
  ),
};

const DEMO_AD_DURATION = 5000; // 5 seconds for demo

class RewardedAdService {
  constructor() {
    // Manage multiple ad instances
    this.ads = {
      VOICE: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      CHAT: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      EXTRA_LIFE: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      EXTRA_SCENARIO: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      VOICE_REPLAY: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      INTERVIEW_LANGUAGE: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      PUZZLE_TIP: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      HINT: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      BLITZ: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      ROAST: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
      DOUBLE_XP: {
        instance: null,
        isLoaded: false,
        isLoading: false,
      },
    };

    this.mode = ADMOB_AVAILABLE ? 'REAL' : 'DEMO';
    Logger.withCategory('ADS').info(
      `Ad Service initialized in ${this.mode} mode`,
      {
        ADMOB_AVAILABLE,
        __DEV__,
        usingTestIds: __DEV__ && ADMOB_AVAILABLE,
        sampleAdUnitId: AD_UNIT_IDS.VOICE,
      }
    );
  }

  /**
   * Initialize and load a rewarded ad for a specific type
   * @param {string} adType - 'VOICE' or 'CHAT'
   */
  async loadAd(adType = 'VOICE') {
    const ad = this.ads[adType];
    if (!ad) {
      Logger.withCategory('ADS').error(`Invalid ad type: ${adType}`);
      return;
    }

    if (ad.isLoading || ad.isLoaded) {
      return;
    }

    // DEMO MODE: Simulate ad loading
    if (this.mode === 'DEMO') {
      ad.isLoading = true;
      setTimeout(() => {
        ad.isLoaded = true;
        ad.isLoading = false;
        Logger.withCategory('ADS').info(`${adType} demo ad loaded`);
      }, 500);
      return;
    }

    // REAL MODE: Load actual AdMob ad
    try {
      ad.isLoading = true;
      const adUnitId = AD_UNIT_IDS[adType];

      Logger.withCategory('ADS').info(`Loading ${adType} ad...`, { adUnitId });

      // Create rewarded ad instance
      // FAMILIES POLICY: Use non-personalized ads for COPPA/child-directed compliance
      ad.instance = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true, // Required for Families Policy compliance
        // contentUrl: 'https://yourapp.com', // Optional: URL of content being shown
      });

      // Log available event types for debugging
      Logger.withCategory('ADS').info('Available event types:', {
        LOADED: RewardedAdEventType?.LOADED,
        EARNED_REWARD: RewardedAdEventType?.EARNED_REWARD,
        CLOSED: AdEventType?.CLOSED,
        ERROR: AdEventType?.ERROR,
      });

      // Set up event listeners with proper null checks
      if (!RewardedAdEventType) {
        throw new Error('RewardedAdEventType is not defined');
      }

      // Set up LOADED event listener
      ad.instance.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          Logger.withCategory('ADS').info(`${adType} ad loaded ✅`);
          ad.isLoaded = true;
          ad.isLoading = false;
        }
      );

      // Set up ERROR event listener - THIS IS CRITICAL for capturing load failures
      if (AdEventType?.ERROR) {
        ad.instance.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            const isNullActivity = error?.code === 'googleMobileAds/null-activity';

            // Only log non-null-activity errors at ERROR level to reduce spam
            if (isNullActivity) {
              Logger.withCategory('ADS').warn(`${adType} ad: Activity not ready yet (will retry later)`);
            } else {
              Logger.withCategory('ADS').error(`${adType} ad failed to load ❌`, {
                code: error?.code,
                message: error?.message,
                domain: error?.domain,
              });
            }

            ad.isLoading = false;
            ad.isLoaded = false;

            // Track retry count to prevent infinite loops
            ad.retryCount = (ad.retryCount || 0) + 1;

            // For null-activity, wait longer (Activity needs to initialize)
            // For other errors, use shorter delay
            // Max 3 retries to prevent spam
            if (ad.retryCount <= 3) {
              const delay = isNullActivity ? 15000 : 5000; // 15s for null-activity, 5s for others
              setTimeout(() => {
                Logger.withCategory('ADS').info(`Retrying ${adType} ad load (attempt ${ad.retryCount}/3)...`);
                this.loadAd(adType);
              }, delay);
            } else {
              Logger.withCategory('ADS').warn(`${adType} ad: Max retries reached, will try again when user requests ad`);
              ad.retryCount = 0; // Reset for next time
            }
          }
        );
      } else {
        Logger.withCategory('ADS').warn('AdEventType.ERROR not available, errors may be silent');
      }

      // Load the ad
      Logger.withCategory('ADS').info(`Starting ad load for ${adType}...`);
      ad.instance.load();
    } catch (error) {
      Logger.withCategory('ADS').error(`Error loading ${adType} ad`, error);
      ad.isLoading = false;
      ad.isLoaded = false;
    }
  }

  /**
   * Show a rewarded ad
   * @param {string} adType - 'VOICE' or 'CHAT'
   * @param {Function} onReward - Callback when user earns reward
   * @param {Function} onClose - Callback when ad closes
   * @param {Function} onError - Callback on error
   */
  async showAd(adType = 'VOICE', onReward, onClose, onError) {
    // Handle legacy calls where adType is actually the onReward callback
    if (typeof adType === 'function') {
      onError = onClose;
      onClose = onReward;
      onReward = adType;
      adType = 'VOICE';
    }

    const ad = this.ads[adType];
    if (!ad) {
      Logger.withCategory('ADS').error(`Invalid ad type: ${adType}`);
      if (onError) onError({ message: 'Invalid ad type' });
      return false;
    }

    if (!ad.isLoaded) {
      Logger.withCategory('ADS').warn(`${adType} ad not ready`);
      if (onError) {
        onError({ message: 'Ad not ready. Please try again in a moment.' });
      }
      this.loadAd(adType);
      return false;
    }

    // DEMO MODE: Simulate ad watching
    if (this.mode === 'DEMO') {
      ad.isLoaded = false;

      Alert.alert(
        '📺 Demo Ad (5s)',
        `[${adType}] In production, a real 60-second video ad will play here.\n\nDemo ad will complete in 5 seconds...`,
        [{ text: 'OK' }]
      );

      setTimeout(() => {
        Logger.withCategory('ADS').info(`${adType} demo ad completed`);

        if (onReward) {
          onReward({ amount: 1, type: `${adType.toLowerCase()}_reward` });
        }

        if (onClose) {
          onClose();
        }

        // Preload next ad
        this.loadAd(adType);
      }, DEMO_AD_DURATION);

      return true;
    }

    // REAL MODE: Show actual AdMob ad
    try {
      Logger.withCategory('ADS').info(`Showing ${adType} ad`);

      let rewardEarned = false;
      let earnedReward = null;

      // FAMILIES POLICY: Track timing for compliance telemetry
      const adShowStartTime = Date.now();
      let rewardEarnedTime = null;

      // Set up one-time reward listener
      const rewardListener = ad.instance.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          rewardEarnedTime = Date.now();
          const watchDurationMs = rewardEarnedTime - adShowStartTime;

          Logger.withCategory('ADS').info(`${adType} reward earned! 🎉`, {
            reward,
            watchDurationMs,
            compliance: 'REWARD_EARNED'
          });
          rewardEarned = true;
          earnedReward = reward;

          // Mark ad as consumed
          ad.isLoaded = false;

          // Call reward callback IMMEDIATELY when reward is earned
          if (onReward) {
            Logger.withCategory('ADS').info(`Calling onReward callback for ${adType}`);
            onReward(reward);
          }
        }
      );

      // Set up one-time close listener - CLOSED is in AdEventType, not RewardedAdEventType
      const closeListener = ad.instance.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          const adCloseTime = Date.now();
          const totalDurationMs = adCloseTime - adShowStartTime;
          const closedEarly = !rewardEarned;

          // FAMILIES POLICY: Log timing telemetry for compliance verification
          Logger.withCategory('ADS').info(`${adType} ad closed`, {
            rewardEarned,
            closedEarly,
            totalDurationMs,
            compliance: closedEarly ? 'CLOSED_EARLY_NO_REWARD' : 'COMPLETED_WITH_REWARD'
          });

          // FAMILIES POLICY: Detect suspicious early close (before 5s skip button appears)
          if (closedEarly && totalDurationMs < 5000) {
            Logger.withCategory('ADS').warn(`${adType} ad closed before 5s skip button appeared`, {
              totalDurationMs,
              compliance: 'UNEXPECTED_EARLY_CLOSE'
            });
          }

          // Call close callback with enhanced data
          if (onClose) {
            onClose({
              rewardEarned,
              closedEarly,
              durationMs: totalDurationMs
            });
          }

          // Preload next ad
          Logger.withCategory('ADS').info(`Preloading next ${adType} ad...`);
          this.loadAd(adType);

          // Clean up listeners
          if (rewardListener) rewardListener();
          if (closeListener) closeListener();
        }
      );

      // Show the ad
      await ad.instance.show();
      Logger.withCategory('ADS').info(`${adType} ad displayed to user`, {
        adShowStartTime,
        compliance: 'AD_DISPLAYED'
      });

      return true;
    } catch (error) {
      Logger.withCategory('ADS').error(`Error showing ${adType} ad`, {
        error: error?.message,
        code: error?.code,
        compliance: 'AD_SHOW_ERROR'
      });
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Check if ad is ready to show
   * @param {string} adType - 'VOICE' or 'CHAT'
   */
  isAdReady(adType = 'VOICE') {
    const ad = this.ads[adType];
    if (!ad) return false;

    if (this.mode === 'DEMO') {
      return ad.isLoaded;
    }

    return ad.isLoaded && ad.instance !== null;
  }

  /**
   * Preload ad for faster showing
   * @param {string} adType - 'VOICE' or 'CHAT'
   */
  preloadAd(adType = 'VOICE') {
    const ad = this.ads[adType];
    if (ad && !ad.isLoaded && !ad.isLoading) {
      this.loadAd(adType);
    }
  }

  /**
   * Preload all ad types
   */
  preloadAllAds() {
    this.loadAd('VOICE');
    this.loadAd('CHAT');
    this.loadAd('EXTRA_LIFE');
    this.loadAd('EXTRA_SCENARIO');
    this.loadAd('VOICE_REPLAY');
    this.loadAd('INTERVIEW_LANGUAGE');
    this.loadAd('HINT');
    this.loadAd('PUZZLE_TIP');
    this.loadAd('BLITZ');
    this.loadAd('ROAST');
    this.loadAd('DOUBLE_XP');
  }

  /**
   * Wait for an ad to be ready (with timeout)
   * @param {string} adType - Ad type to wait for
   * @param {number} timeoutMs - Max time to wait (default 10s)
   * @returns {Promise<boolean>} - True if ad became ready, false if timeout
   */
  async waitForAdReady(adType, timeoutMs = 10000) {
    const ad = this.ads[adType];
    if (!ad) return false;

    // Already ready
    if (this.isAdReady(adType)) return true;

    // Start loading if not already
    if (!ad.isLoading) {
      this.loadAd(adType);
    }

    // Poll for readiness
    const startTime = Date.now();
    const pollInterval = 200; // Check every 200ms

    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isAdReady(adType)) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime >= timeoutMs) {
          Logger.withCategory('ADS').warn(`${adType} ad load timeout after ${timeoutMs}ms`);
          resolve(false);
          return;
        }

        setTimeout(checkReady, pollInterval);
      };

      checkReady();
    });
  }

  /**
   * Show ad with automatic waiting - waits for ad to load instead of failing immediately
   * Big apps use this pattern to avoid "ad not ready" errors
   * 
   * @param {string} adType - Ad type
   * @param {Function} onReward - Reward callback
   * @param {Function} onClose - Close callback  
   * @param {Function} onError - Error callback
   * @param {Function} onLoadingStart - Called when waiting for ad starts (show spinner)
   * @param {Function} onLoadingEnd - Called when waiting ends (hide spinner)
   * @param {number} timeoutMs - Max wait time (default 10s)
   */
  async showAdWithWait(adType, onReward, onClose, onError, onLoadingStart, onLoadingEnd, timeoutMs = 10000) {
    const ad = this.ads[adType];
    if (!ad) {
      Logger.withCategory('ADS').error(`Invalid ad type: ${adType}`);
      if (onError) onError({ message: 'Invalid ad type' });
      return false;
    }

    // If ad is ready, show immediately
    if (this.isAdReady(adType)) {
      return this.showAd(adType, onReward, onClose, onError);
    }

    // Ad not ready - wait for it
    Logger.withCategory('ADS').info(`${adType} ad not ready, waiting...`);

    // Notify caller that loading started (they can show a spinner)
    if (onLoadingStart) onLoadingStart();

    try {
      const ready = await this.waitForAdReady(adType, timeoutMs);

      // Notify caller that loading ended
      if (onLoadingEnd) onLoadingEnd();

      if (ready) {
        return this.showAd(adType, onReward, onClose, onError);
      } else {
        // Timeout - ad still not ready
        Logger.withCategory('ADS').warn(`${adType} ad not available after waiting`);
        if (onError) {
          onError({ message: 'Ad not available. Please check your connection and try again.' });
        }
        return false;
      }
    } catch (error) {
      if (onLoadingEnd) onLoadingEnd();
      Logger.withCategory('ADS').error(`Error waiting for ${adType} ad`, error);
      if (onError) onError(error);
      return false;
    }
  }

  // ============================================================================
  // Screen-Specific Preload Helpers
  // ============================================================================

  /**
   * Preload ads needed for Home/Chat screens
   */
  preloadForHome() {
    this.preloadAd('CHAT');
    this.preloadAd('VOICE');
    this.preloadAd('VOICE_REPLAY');
    this.preloadAd('ROAST');
  }

  /**
   * Preload ads needed for Weekly Puzzle screen
   */
  preloadForPuzzle() {
    this.preloadAd('HINT');
    this.preloadAd('PUZZLE_TIP');
    this.preloadAd('BLITZ');
  }

  /**
   * Preload ads needed for Daily Challenge screen
   */
  preloadForDailyChallenge() {
    this.preloadAd('EXTRA_LIFE');
  }

  /**
   * Preload ads needed for Interview screen
   */
  preloadForInterview() {
    this.preloadAd('INTERVIEW_LANGUAGE');
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Get all available ad types
   * @returns {string[]} Array of ad type names
   */
  getAllAdTypes() {
    return Object.keys(this.ads);
  }
}

// Export singleton instance
const rewardedAdService = new RewardedAdService();

// Preload all ad types on app start (with delay to ensure SDK is initialized)
if (ADMOB_AVAILABLE) {
  setTimeout(() => {
    Logger.withCategory('ADS').info('🚀 Starting ad preload...');
    rewardedAdService.preloadAllAds();
  }, 2000); // Wait 2 seconds for AdMob SDK to initialize
} else {
  // In demo mode, preload immediately
  rewardedAdService.preloadAllAds();
}

export default rewardedAdService;

/* 
============================================================================
   HYBRID ADMOB SERVICE - AUTO-DETECTS PACKAGE AVAILABILITY
============================================================================

This service automatically detects if react-native-google-mobile-ads is
available and working. If not, it falls back to demo mode.

MODES:
- DEMO: Package not installed or __DEV__ mode (shows 5s demo ads)
- REAL: Package installed and production build (shows real AdMob ads)

USAGE (same as before):
- rewardedAdService.showAd('VOICE', onReward, onClose, onError)
- rewardedAdService.showAd('CHAT', onReward, onClose, onError)

This allows development to continue even if the AdMob package has issues.
Real ads will work automatically once the package is properly installed.

============================================================================
   GOOGLE PLAY FAMILIES POLICY COMPLIANCE GUIDE
============================================================================

This service is configured to comply with Google Play Families Policy.
The following configurations have been applied:

1. NON-PERSONALIZED ADS ONLY
   - requestNonPersonalizedAdsOnly: true is set for all ad requests
   - This ensures COPPA/child-directed compliance

2. TIMING TELEMETRY
   - Ad show start time is tracked
   - Reward earned time is tracked
   - Close time is tracked
   - Early close (before EARNED_REWARD) is logged
   - Suspicious early close (before 5s) is flagged

3. ENHANCED CLOSE CALLBACK
   - onClose now receives { rewardEarned, closedEarly, durationMs }
   - This allows consuming code to handle early closes appropriately

============================================================================
   ADMOB CONSOLE CONFIGURATION - STEP BY STEP
============================================================================

To fully comply with Google Play Families Policy, you must ALSO configure
your ad units in the AdMob console. Follow these steps:

STEP 1: Navigate to AdMob Console
   - Go to https://admob.google.com
   - Sign in with your AdMob account

STEP 2: Enable "Designed for Families" for your app
   - Click on "Apps" in the left sidebar
   - Select your app (Linguana)
   - Go to "App settings"
   - Under "Family policy", toggle ON "Designed for Families"
   - If prompted, confirm that your app is child-directed

STEP 3: Configure Content Filters for EACH Ad Unit
   - Go to "Apps" > "Ad units"
   - For EACH ad unit listed below, click "Edit":
   
   AD UNIT IDS (Android):
   - VOICE: ca-app-pub-5060300106472726/7821826877
   - CHAT: ca-app-pub-5060300106472726/3650477108
   - EXTRA_LIFE: ca-app-pub-5060300106472726/2588676870
   - EXTRA_SCENARIO: ca-app-pub-5060300106472726/9981023687
   - VOICE_REPLAY: ca-app-pub-5060300106472726/3533027222
   - INTERVIEW_LANGUAGE: ca-app-pub-5060300106472726/6451491141
   - HINT: ca-app-pub-5060300106472726/1999595848
   - PUZZLE_TIP: ca-app-pub-5060300106472726/9387949515
   - BLITZ: ca-app-pub-5060300106472726/9987102350
   - ROAST: ca-app-pub-5060300106472726/9987102350 (same as BLITZ)
   - DOUBLE_XP: ca-app-pub-5060300106472726/3803470405
   
   AD UNIT IDS (iOS):
   - VOICE: ca-app-pub-5060300106472726/8209912481
   - CHAT: ca-app-pub-5060300106472726/4710377526
   - EXTRA_LIFE: ca-app-pub-5060300106472726/5831887504
   - EXTRA_SCENARIO: ca-app-pub-5060300106472726/7089128851
   - VOICE_REPLAY: ca-app-pub-5060300106472726/9056816643
   - INTERVIEW_LANGUAGE: ca-app-pub-5060300106472726/9195691096
   - HINT: ca-app-pub-5060300106472726/9387949515
   - PUZZLE_TIP: ca-app-pub-5060300106472726/1999595848
   - BLITZ: ca-app-pub-5060300106472726/4595174873
   - ROAST: ca-app-pub-5060300106472726/4595174873 (same as BLITZ)
   - DOUBLE_XP: ca-app-pub-5060300106472726/4163574813

STEP 4: Block Required Ad Categories
   For each ad unit, go to "Content filters" and BLOCK these categories:
   
   ┌─────────────────────────────────────────────────────────────────────┐
   │ CATEGORY                 │ REASON                                  │
   ├─────────────────────────────────────────────────────────────────────┤
   │ Alcohol                  │ Not appropriate for children            │
   │ Gambling & Betting       │ Not appropriate for children            │
   │ Dating                   │ Not appropriate for children            │
   │ Mature/Adult Content     │ Not appropriate for children            │
   │ Sexual Content           │ Not appropriate for children            │
   │ Violence                 │ May be inappropriate for children       │
   │ Political                │ May be inappropriate for young users    │
   │ Religion                 │ May be sensitive for young users        │
   │ Cryptocurrency           │ Financial products, not for children    │
   │ Get Rich Quick           │ Potentially misleading for children     │
   └─────────────────────────────────────────────────────────────────────┘

STEP 5: Save and Verify
   - Save changes for each ad unit
   - Wait 24-48 hours for changes to propagate
   - Test with test ads to verify compliance

============================================================================
   PRE-AD CONSENT FLOW (FAMILIES POLICY REQUIREMENT)
============================================================================

The PreAdConsentDialog component MUST be shown before any ad is displayed.
This is a REQUIREMENT for Families Policy compliance.

CONSENT FLOW:
1. User triggers ad action (e.g., "Watch Ad for Extra Life")
2. Show PreAdConsentDialog with message:
   "Watch the complete video to earn your reward. You can close the ad 
   after 5 seconds, but you won't receive the reward if you close early."
3. User clicks "Watch Ad" → Show the actual ad
4. User clicks "Cancel" → Do not show ad, return to app

IMPORTANT: Never show an ad without first showing the consent dialog!

EXAMPLE USAGE:

```javascript
import PreAdConsentDialog from '../components/PreAdConsentDialog';
import rewardedAdService from '../services/rewardedAdService';

// In your component state:
const [showConsentDialog, setShowConsentDialog] = useState(false);

// When user wants to watch an ad:
const handleWatchAdPress = () => {
  setShowConsentDialog(true);
};

// When user consents:
const handleConsent = async () => {
  setShowConsentDialog(false);
  
  await rewardedAdService.showAdWithWait(
    'EXTRA_LIFE',
    (reward) => {
      // Reward earned!
      grantExtraLife();
    },
    (closeData) => {
      // Ad closed
      if (closeData.closedEarly) {
        console.log('User closed ad early, no reward');
      }
    },
    (error) => {
      // Error showing ad
      Alert.alert('Error', error.message);
    },
    () => setLoading(true),   // onLoadingStart
    () => setLoading(false),  // onLoadingEnd
  );
};

// When user cancels:
const handleCancel = () => {
  setShowConsentDialog(false);
};

// In your render:
<PreAdConsentDialog
  visible={showConsentDialog}
  onWatchAd={handleConsent}
  onCancel={handleCancel}
  rewardDescription="+1 Extra Life"
/>
```

============================================================================
*/

