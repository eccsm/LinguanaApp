/**
 * Analytics Service - Backend Integration
 * Tracks user activity, lesson completion, and vocabulary reviews
 */

import axios from 'axios';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import Logger from '../utils/logger';

class AnalyticsService {
  constructor() {
    this.backendUrl = BACKEND_URL;
    this.headers = {
      'Content-Type': 'application/json',
      'x-client-secret': APP_CLIENT_SECRET
    };
  }

  /**
   * Track user activity (login, session start, etc.)
   * @param {string} userId - Firebase user ID
   * @param {string} activityType - Type of activity ('login', 'session_start', 'app_open', etc.)
   * @param {Object} metadata - Additional activity metadata
   */
  async trackActivity(userId, activityType, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.backendUrl}/api/user-activity`,
        {
          userId,
          activityType,
          timestamp: new Date().toISOString(),
          metadata
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      Logger.withCategory('ANALYTICS').error('Failed to track activity', { activityType, error });
      // Don't throw - analytics failures shouldn't break app
      return null;
    }
  }

  /**
   * Track lesson/conversation completion
   * @param {string} userId - Firebase user ID
   * @param {string} scenarioId - Scenario ID (e.g., 'CAFE', 'RESTAURANT')
   * @param {string} language - Language code (e.g., 'es', 'fr')
   * @param {Object} stats - Lesson statistics (duration, messages, etc.)
   */
  async trackLessonComplete(userId, scenarioId, language, stats = {}) {
    try {
      Logger.withCategory('ANALYTICS').info('Tracking lesson completion', { scenarioId, language });

      const response = await axios.post(
        `${this.backendUrl}/api/lesson-complete`,
        {
          userId,
          scenarioId,
          language,
          completedAt: new Date().toISOString(),
          stats: {
            duration: stats.duration || 0,
            messageCount: stats.messageCount || 0,
            wordsLearned: stats.wordsLearned || 0,
            ...stats
          }
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      Logger.withCategory('ANALYTICS').error('Failed to track lesson completion', { scenarioId, error });
      return null;
    }
  }

  /**
   * Submit vocabulary review (SRS flashcard)
   * @param {string} userId - Firebase user ID
   * @param {string} cardId - Flashcard/word ID
   * @param {number} quality - Review quality (1-5, where 1=Hard, 3=Good, 5=Easy)
   * @param {Object} cardData - Additional card data (not sent to backend)
   */
  async submitReview(userId, cardId, quality, cardData = {}) {
    try {
      // Backend expects reviews array with wordId field
      const response = await axios.post(
        `${this.backendUrl}/api/review`,
        {
          userId,
          reviews: [{  // Wrap in array for batch processing
            wordId: cardId,  // Backend uses wordId, not cardId
            quality: quality
          }]
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      Logger.withCategory('ANALYTICS').error('Failed to submit review', { cardId, quality, error });
      return null;
    }
  }

  /**
   * Extract vocabulary from completed conversation
   * @param {string} userId - Firebase user ID
   * @param {string} conversationId - Conversation ID
   * @param {Array} messages - Array of conversation messages
   * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr')
   * @param {string} nativeLanguage - Native language code (e.g., 'en')
   */
  async extractVocabulary(userId, conversationId, messages, targetLanguage = 'es', nativeLanguage = 'en') {
    try {
      Logger.withCategory('ANALYTICS').info('Extracting vocabulary', {
        conversationId,
        messageCount: messages.length,
        targetLanguage
      });

      const response = await axios.post(
        `${this.backendUrl}/api/extract-vocabulary`,
        {
          userId,
          conversationId,
          messages,
          targetLanguage,
          nativeLanguage
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      Logger.withCategory('ANALYTICS').error('Failed to extract vocabulary', { conversationId, error });
      return null;
    }
  }

  /**
   * Grant session rewards (XP and Gems)
   * @param {string} userId - Firebase user ID
   * @param {string} type - Session type ('review' or 'roleplay')
   * @param {string} sessionId - Unique session ID to prevent duplicates
   */
  async grantSessionRewards(userId, type, sessionId) {
    try {
      Logger.withCategory('ANALYTICS').info('Requesting session rewards', { type, sessionId });

      const response = await axios.post(
        `${this.backendUrl}/api/grant-rewards`,
        {
          userId,
          type,
          sessionId
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      // Check if it's a duplicate reward error
      if (error.response?.status === 409) {
        Logger.withCategory('ANALYTICS').warn('Session already rewarded', { sessionId });
        return {
          success: false,
          alreadyRewarded: true,
          error: 'Session already rewarded'
        };
      }
      Logger.withCategory('ANALYTICS').error('Failed to grant rewards', { sessionId, error });
      return null;
    }
  }

  /**
   * Track app open/session start
   * @param {string} userId - Firebase user ID
   */
  async trackAppOpen(userId) {
    return this.trackActivity(userId, 'app_open', {
      platform: 'android',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user login
   * @param {string} userId - Firebase user ID
   * @param {string} loginMethod - Login method ('google', 'facebook', 'email')
   */
  async trackLogin(userId, loginMethod) {
    return this.trackActivity(userId, 'login', {
      method: loginMethod,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track scenario selection
   * @param {string} userId - Firebase user ID
   * @param {string} scenarioId - Selected scenario ID
   * @param {string} language - Selected language
   */
  async trackScenarioStart(userId, scenarioId, language) {
    return this.trackActivity(userId, 'scenario_start', {
      scenarioId,
      language,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track premium conversion (subscription purchase)
   * @param {string} userId - Firebase user ID
   * @param {string} plan - Subscription plan ('monthly', 'yearly')
   * @param {number} amount - Purchase amount
   */
  async trackPremiumConversion(userId, plan, amount) {
    return this.trackActivity(userId, 'premium_purchase', {
      plan,
      amount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track ad watched
   * @param {string} userId - Firebase user ID
   * @param {string} adType - Type of ad ('voice_try', 'extra_chats', etc.)
   */
  async trackAdWatched(userId, adType) {
    return this.trackActivity(userId, 'ad_watched', {
      adType,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
