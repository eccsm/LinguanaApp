/**
 * Interview Service
 * Handles interview progress persistence, daily limits, and history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';

const STORAGE_KEYS = {
    INTERVIEW_PROGRESS: '@interview_progress',
    DAILY_INTERVIEW_COUNT: '@daily_interview_count',
    DAILY_INTERVIEW_DATE: '@daily_interview_date',
    LAST_INTERVIEW_AD_DATE: '@last_interview_ad_date',
    LAST_ACTIVE_INTERVIEW: '@interview_last_active_id',
};

const InterviewLogger = Logger.withCategory('INTERVIEW');

// Helper for UTC date comparison (consistent global timing)
const getUTCDateString = (date = new Date()) => date.toISOString().split('T')[0];

class InterviewService {
    /**
     * Save interview progress to AsyncStorage
     */
    async saveProgress(data) {
        try {
            const progressData = {
                ...data,
                savedAt: new Date().toISOString(),
            };

            // Generate unique ID based on params
            // Use categoryId if available (it's the ID string), otherwise fallback to category (if it's a string)
            const catId = data.categoryId || (typeof data.category === 'string' ? data.category : data.category?.id);
            const topId = data.topicId || (typeof data.topic === 'string' ? data.topic : data.topic?.id);
            const diffId = data.difficultyId || (typeof data.difficulty === 'string' ? data.difficulty : data.difficulty?.id);

            const id = `${catId}_${topId}_${diffId}`;
            const key = `@interview_progress_${id}`;

            // Save specific progress
            await AsyncStorage.setItem(key, JSON.stringify(progressData));

            // Update last active interview ID
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_INTERVIEW, id);

            // Also save to legacy key for backward compatibility/safety
            await AsyncStorage.setItem(
                STORAGE_KEYS.INTERVIEW_PROGRESS,
                JSON.stringify(progressData)
            );

            InterviewLogger.info('Progress saved', {
                id,
                questionCount: data.questionCount,
                messagesCount: data.messages?.length
            });
            return true;
        } catch (error) {
            InterviewLogger.error('Failed to save progress:', error);
            return false;
        }
    }

    /**
     * Load saved interview progress
     */
    async loadProgress(params = null) {
        try {
            let key = STORAGE_KEYS.INTERVIEW_PROGRESS; // Default to legacy

            if (params) {
                // Load specific progress if params provided
                const catId = params.categoryId || (typeof params.category === 'string' ? params.category : params.category?.id);
                const topId = params.topicId || (typeof params.topic === 'string' ? params.topic : params.topic?.id);
                const diffId = params.difficultyId || (typeof params.difficulty === 'string' ? params.difficulty : params.difficulty?.id);

                const id = `${catId}_${topId}_${diffId}`;
                key = `@interview_progress_${id}`;
            } else {
                // Load last active if no params
                const lastId = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_INTERVIEW);
                if (lastId) {
                    key = `@interview_progress_${lastId}`;
                }
            }

            const data = await AsyncStorage.getItem(key);

            if (data) {
                const parsed = JSON.parse(data);
                InterviewLogger.info('Progress loaded', {
                    key,
                    questionCount: parsed.questionCount,
                    messagesCount: parsed.messages?.length
                });
                return parsed;
            }
            return null;
        } catch (error) {
            InterviewLogger.error('Failed to load progress:', error);
            return null;
        }
    }

    /**
     * Clear saved progress (after completion or fresh start)
     */
    async clearProgress(params = null) {
        try {
            if (params) {
                const catId = params.categoryId || (typeof params.category === 'string' ? params.category : params.category?.id);
                const topId = params.topicId || (typeof params.topic === 'string' ? params.topic : params.topic?.id);
                const diffId = params.difficultyId || (typeof params.difficulty === 'string' ? params.difficulty : params.difficulty?.id);

                const id = `${catId}_${topId}_${diffId}`;
                const key = `@interview_progress_${id}`;
                await AsyncStorage.removeItem(key);
            } else {
                // Clear last active
                const lastId = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_INTERVIEW);
                if (lastId) {
                    await AsyncStorage.removeItem(`@interview_progress_${lastId}`);
                    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE_INTERVIEW);
                }
                // Also clear legacy
                await AsyncStorage.removeItem(STORAGE_KEYS.INTERVIEW_PROGRESS);
            }

            InterviewLogger.info('Progress cleared');
            return true;
        } catch (error) {
            InterviewLogger.error('Failed to clear progress:', error);
            return false;
        }
    }

    /**
     * Check if there's saved progress
     */
    async hasProgress() {
        const progress = await this.loadProgress();
        return progress !== null;
    }

    /**
     * Check if there's VALID saved progress (with real content that should be resumed)
     * Returns the saved progress if valid, null otherwise
     */
    async hasValidProgress() {
        const progress = await this.loadProgress();

        // Only consider it valid if there are at least 2 messages and questionCount > 0
        // This means the user actually started the interview (answered at least 1 question)
        if (progress && progress.messages?.length >= 2 && progress.questionCount > 0) {
            InterviewLogger.info('Valid saved progress found', {
                category: progress.category?.label || progress.categoryId,
                topic: progress.topic?.label || progress.topicId,
                questionCount: progress.questionCount
            });
            return progress;
        }

        return null;
    }

    /**
     * Get daily interview count from Firestore
     */
    async getDailyInterviewCount() {
        try {
            const user = auth().currentUser;
            if (!user) return 0;

            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (!userDoc.exists) return 0;

            const data = userDoc.data();
            const todayUTC = getUTCDateString();
            const lastDate = data.lastInterviewDate?.toDate?.();
            const lastDateUTC = lastDate ? getUTCDateString(lastDate) : null;

            // Reset count if it's a new day (UTC)
            if (lastDateUTC !== todayUTC) {
                // We don't need to explicitly reset here as we just return 0
                // The next increment will set the date to today
                return 0;
            }

            return data.dailyInterviewCount || 0;
        } catch (error) {
            InterviewLogger.error('Failed to get daily count:', error);
            return 0;
        }
    }

    /**
     * Increment daily interview count in Firestore
     */
    async incrementDailyCount() {
        try {
            const user = auth().currentUser;
            if (!user) return 0;

            const userRef = firestore().collection('users').doc(user.uid);
            const today = new Date();
            const todayStr = today.toDateString();

            // Use transaction to ensure atomic read-modify-write
            const newCount = await firestore().runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);

                if (!doc.exists) {
                    // Create user doc if it doesn't exist (unlikely but safe)
                    transaction.set(userRef, {
                        dailyInterviewCount: 1,
                        lastInterviewDate: firestore.Timestamp.fromDate(today)
                    }, { merge: true });
                    return 1;
                }

                const data = doc.data();
                const lastDate = data.lastInterviewDate?.toDate?.();
                const lastDateUTC = lastDate ? getUTCDateString(lastDate) : null;
                const todayUTC = getUTCDateString();

                let nextCount = 1;

                if (lastDateUTC !== todayUTC) {
                    // New day (or first time), reset to 1
                    transaction.update(userRef, {
                        dailyInterviewCount: 1,
                        lastInterviewDate: firestore.Timestamp.fromDate(today)
                    });
                    nextCount = 1;
                } else {
                    // Same day, increment
                    nextCount = (data.dailyInterviewCount || 0) + 1;
                    transaction.update(userRef, {
                        dailyInterviewCount: nextCount
                    });
                }

                return nextCount;
            });

            InterviewLogger.info(`Daily count incremented to ${newCount}`);
            return newCount;
        } catch (error) {
            InterviewLogger.error('Failed to increment count:', error);
            return 0;
        }
    }

    /**
     * Check if user has reached daily limit (1 for free users)
     */
    async hasReachedDailyLimit(isPro) {
        if (isPro) return false; // Pro users have unlimited

        const count = await this.getDailyInterviewCount();
        const extraInterviews = await this.getExtraInterviews();

        // If user has extra interviews, they haven't reached limit effectively
        if (extraInterviews > 0) return false;

        return count >= 1;
    }

    /**
     * Get extra interviews count from Firestore
     */
    async getExtraInterviews() {
        try {
            const user = auth().currentUser;
            if (!user) return 0;

            const userDoc = await firestore().collection('users').doc(user.uid).get();
            return userDoc.data()?.extraInterviews || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Earn extra interview (from watching ad)
     */
    async earnExtraInterview() {
        try {
            const user = auth().currentUser;
            if (!user) return false;

            const token = await user.getIdToken();

            const response = await fetch(`${BACKEND_URL}/grant-rewards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-client-secret': APP_CLIENT_SECRET
                },
                body: JSON.stringify({
                    type: 'ad_reward',
                    rewardType: 'interview'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                InterviewLogger.error('Backend error:', errorText);
                return false;
            }

            const result = await response.json();
            InterviewLogger.info('Earned extra interview via backend. New count:', result.newCount);
            return true;
        } catch (error) {
            InterviewLogger.error('Failed to earn extra interview:', error);
            return false;
        }
    }

    /**
     * Check if user has already watched an ad for interview today
     */
    async hasWatchedAdToday() {
        try {
            const user = auth().currentUser;
            if (!user) return false;

            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const lastAdDate = userDoc.data()?.lastInterviewAdDate?.toDate?.();
            const lastAdDateUTC = lastAdDate ? getUTCDateString(lastAdDate) : null;
            const todayUTC = getUTCDateString();

            return lastAdDateUTC === todayUTC;
        } catch (error) {
            return false;
        }
    }

    /**
     * Mark ad as watched for today
     */
    async markAdWatchedToday() {
        try {
            const user = auth().currentUser;
            if (!user) return false;

            await firestore().collection('users').doc(user.uid).update({
                lastInterviewAdDate: firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Consume extra interview (when starting interview over limit)
     */
    async consumeExtraInterview() {
        try {
            const user = auth().currentUser;
            if (!user) return false;

            const userRef = firestore().collection('users').doc(user.uid);

            // Use transaction to ensure we don't go below 0
            return await firestore().runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                const current = doc.data()?.extraInterviews || 0;

                if (current > 0) {
                    transaction.update(userRef, {
                        extraInterviews: firestore.FieldValue.increment(-1)
                    });
                    return true;
                }
                return false;
            });
        } catch (error) {
            InterviewLogger.error('Failed to consume extra interview:', error);
            return false;
        }
    }

    /**
     * Save completed interview to Firebase history (conversations collection)
     */
    async saveToHistory(interviewData) {
        try {
            const user = auth().currentUser;
            if (!user) {
                InterviewLogger.warn('No user logged in, cannot save to history');
                return false;
            }

            // Create conversation document
            const conversationRef = await firestore().collection('conversations').add({
                userId: user.uid,
                type: 'interview',
                scenarioId: 'INTERVIEW', // Placeholder for compatibility
                categoryId: interviewData.categoryId || 'general',
                topicId: interviewData.topicId || null,
                difficultyId: interviewData.difficultyId || 'intermediate',
                language: interviewData.language,
                createdAt: firestore.FieldValue.serverTimestamp(),
                messageCount: interviewData.messages.length,
                // Store labels for easy display
                title: interviewData.category.label || interviewData.category,
                subtitle: interviewData.topic?.label || interviewData.topic || '',
            });

            // Save messages to subcollection with order index for proper sequencing
            const batch = firestore().batch();
            const messagesRef = conversationRef.collection('messages');

            interviewData.messages.forEach((msg, index) => {
                const docRef = messagesRef.doc();
                batch.set(docRef, {
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp || firestore.FieldValue.serverTimestamp(),
                    order: index, // Preserve message order for proper display
                });
            });

            await batch.commit();

            // Increment totalInterviews count on user profile
            await firestore().collection('users').doc(user.uid).update({
                totalInterviews: firestore.FieldValue.increment(1)
            });

            InterviewLogger.info('Interview saved to history');
            return true;
        } catch (error) {
            InterviewLogger.error('Failed to save to history:', error);
            return false;
        }
    }

    /**
     * Get interview history from Firebase
     */
    async getHistory(limit = 20) {
        try {
            const user = auth().currentUser;
            if (!user) return [];

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('chatHistory')
                .where('type', '==', 'interview')
                .orderBy('completedAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            InterviewLogger.error('Failed to get history:', error);
            return [];
        }
    }
}

// Export singleton
const interviewService = new InterviewService();
export default interviewService;
