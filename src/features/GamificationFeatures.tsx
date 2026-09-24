import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import analyticsService from '../services/analyticsService';
import Logger from '../utils/logger';

/**
 * ==========================================
 * TYPES - Updated to match backend schema
 * ==========================================
 */
interface UserStats {
    currentStreak: number;
    longestStreak: number;
    lastActive: any; // Timestamp
    gems: number;
    xp: number;
    lives: number; // Daily challenge lives (default 3, resets daily)
    inventory?: {
        streakFreeze?: number;
    };
    ownedPacks?: Record<string, boolean>; // Purchased scenario packs
}

interface Flashcard {
    wordId: string;
    front: string;        // Target language text
    back: string;         // Native language translation
    context?: string;     // Example sentence
    interval: number;     // Days until next review
    repetitions: number;  // Times successfully reviewed
    easeFactor: number;   // SM-2 multiplier (default 2.5)
    nextReview: any;      // Timestamp - when card becomes due
    lastReviewed?: any;   // Timestamp - date of last review
}

/**
 * ==========================================
 * HOOK: useGamification
 * Manages fetching stats and handling SRS logic
 * ==========================================
 */
export const useGamification = () => {
    const [stats, setStats] = useState<UserStats>({
        currentStreak: 0,
        longestStreak: 0,
        lastActive: null,
        gems: 0,
        xp: 0,
        lives: 3, // Default 3 lives
        inventory: { streakFreeze: 0 },
        ownedPacks: {}
    });
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [isFetchingCards, setIsFetchingCards] = useState(false);

    const user = auth().currentUser;

    useEffect(() => {
        if (!user) {
            Logger.info('[VOCAB_DEBUG] No user logged in, skipping vocab fetch');
            return;
        }

        Logger.info('[VOCAB_DEBUG] 🔄 Initializing vocabulary system for user:', user.uid);

        // Real-time listener for user stats
        const unsub = firestore()
            .collection('users')
            .doc(user.uid)
            .onSnapshot(doc => {
                if (doc.exists()) {
                    const data = doc.data();
                    const statsData = {
                        currentStreak: data?.currentStreak || 0,
                        longestStreak: data?.longestStreak || 0,
                        lastActive: data?.lastActive || null,
                        gems: data?.gems || 0,
                        xp: data?.xp || 0,
                        lives: data?.lives ?? 3, // Default to 3 if undefined
                        inventory: data?.inventory || { streakFreeze: 0 },
                        ownedPacks: data?.ownedPacks || {}, // Include purchased packs
                    };
                    setStats(statsData);
                    Logger.info('[VOCAB_DEBUG] 📊 User stats updated:', {
                        xp: statsData.xp,
                        streak: statsData.currentStreak,
                        lives: statsData.lives,
                        totalReviews: data?.totalReviews || 0
                    });
                } else {
                    Logger.info('[VOCAB_DEBUG] ⚠️ User document not found');
                }
            });

        return () => {
            Logger.info('[VOCAB_DEBUG] 🔌 Cleaning up vocabulary listeners');
            unsub();
        };
    }, [user]);

    // Fetch due cards (Simple query: nextReview <= now)
    // Added re-entry prevention to avoid race conditions during navigation
    const fetchDueCards = React.useCallback(async () => {
        if (!user || isFetchingCards) return;
        try {
            setIsFetchingCards(true);
            const now = new Date();
            Logger.info('[VOCAB_DEBUG] 🔍 Fetching due cards...', {
                userId: user.uid,
                currentTime: now.toISOString()
            });

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('vocabDeck')
                .where('nextReview', '<=', now)
                .limit(20)
                .get();

            const cards = snapshot.docs.map(doc => ({
                wordId: doc.id,
                ...doc.data()
            } as Flashcard));

            Logger.info('[VOCAB_DEBUG] ✅ Due cards fetched:', {
                count: cards.length,
                cards: cards.map(c => ({ word: c.front, nextReview: c.nextReview }))
            });

            setDueCards(cards);
        } catch (error) {
            Logger.error('[VOCAB_DEBUG] ❌ Error fetching due cards:', error);
            setDueCards([]);
        } finally {
            setIsFetchingCards(false);
        }
    }, [user, isFetchingCards]);


    useEffect(() => {
        fetchDueCards();
    }, [fetchDueCards]);

    // Submit a review result to backend (or update locally and sync)
    const submitReview = async (cardId: string, quality: number) => {
        if (!user) {
            Logger.info('[VOCAB_DEBUG] ⚠️ Cannot submit review - no user');
            return;
        }

        Logger.info('[VOCAB_DEBUG] 📝 Submitting review:', {
            cardId,
            quality,
            userId: user.uid
        });

        // Find the card being reviewed
        const card = dueCards.find(c => c.wordId === cardId);

        if (!card) {
            Logger.info('[VOCAB_DEBUG] ⚠️ Card not found in dueCards:', cardId);
            return;
        }

        Logger.info('[VOCAB_DEBUG] 📤 Sending to backend:', {
            front: card.front,
            back: card.back,
            currentInterval: card.interval,
            currentReps: card.repetitions
        });

        // Call backend to process SRS algorithm and update stats
        const result = await analyticsService.submitReview(user.uid, cardId, quality, {
            front: card?.front,
            back: card?.back,
            interval: card?.interval,
            repetitions: card?.repetitions,
            easeFactor: card?.easeFactor
        });

        if (result) {
            Logger.info('[VOCAB_DEBUG] ✅ Review submitted successfully');
        } else {
            Logger.info('[VOCAB_DEBUG] ❌ Review submission failed');
        }

        // Remove from local queue (optimistic update)
        setDueCards(prev => {
            const updated = prev.filter(c => c.wordId !== cardId);
            Logger.info('[VOCAB_DEBUG] 🔄 Updated dueCards count:', updated.length);
            return updated;
        });

        // NOTE: XP is granted at session end via grantSessionRewards in ReviewSessionScreen
        // Do NOT increment XP here to avoid double-counting
    };

    /**
     * Earn XP - directly increments XP in Firestore
     * Applies XP multiplier if XP Potion is active
     * Used for ad rewards, bonuses, Speed Swipe, Review Sessions, etc.
     */
    const earnXP = async (amount: number): Promise<boolean> => {
        Logger.info('[GAMIFICATION] earnXP called with:', { amount, hasUser: !!user });

        if (!user) {
            Logger.info('[GAMIFICATION] Cannot earn XP - no user logged in');
            return false;
        }

        if (amount <= 0) {
            Logger.info('[GAMIFICATION] Cannot earn XP - invalid amount:', { amount });
            return false;
        }

        try {
            // Check for active XP buff (potion)
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            let multiplier = 1;

            if (userDoc.exists()) {
                const data = userDoc.data();
                const buffs = data?.activeBuffs || {};
                const now = new Date();

                if (buffs.xpMultiplierUntil) {
                    const expiresAt = buffs.xpMultiplierUntil.toDate?.() || new Date(buffs.xpMultiplierUntil);
                    if (expiresAt > now) {
                        multiplier = buffs.xpMultiplier || 2;
                        Logger.info('[GAMIFICATION] 🧪 XP Potion active! Multiplier:', multiplier);
                    }
                }
            }

            const finalAmount = amount * multiplier;
            Logger.info('[GAMIFICATION] 💰 Earning XP:', {
                baseAmount: amount,
                multiplier,
                finalAmount,
                userId: user.uid
            });

            // Update local state immediately for responsive UI
            setStats(prev => ({
                ...prev,
                xp: (prev.xp || 0) + finalAmount
            }));

            // Use set with merge to handle cases where xp field might not exist
            await firestore()
                .collection('users')
                .doc(user.uid)
                .set({
                    xp: firestore.FieldValue.increment(finalAmount)
                }, { merge: true });

            Logger.info('[GAMIFICATION] ✅ XP earned successfully:', { finalAmount, userId: user.uid });
            return true;
        } catch (error) {
            Logger.error('[GAMIFICATION] ❌ Failed to earn XP:', error);
            // Revert local state on failure
            setStats(prev => ({
                ...prev,
                xp: Math.max(0, (prev.xp || 0) - amount)
            }));
            return false;
        }
    };

    return { stats, dueCards, submitReview, fetchDueCards, earnXP };
};

/**
 * ==========================================
 * COMPONENT: StreakBadge
 * Displays the flame icon and count
 * ==========================================
 */
export const StreakBadge = () => {
    const { stats } = useGamification();

    return (
        <View style={styles.badgeContainer}>
            <Text style={styles.fireIcon}>🔥</Text>
            <Text style={styles.streakText}>{stats.currentStreak}</Text>
        </View>
    );
};

/**
 * ==========================================
 * COMPONENT: SRSFlashcard
 * Interactive card with self-rating buttons
 * ==========================================
 */
export const SRSFlashcard = ({ card, onReview }: { card: Flashcard, onReview: (q: number) => void }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity
                style={styles.cardFace}
                onPress={() => setFlipped(!flipped)}
                activeOpacity={0.9}
            >
                <Text style={styles.cardText}>
                    {flipped ? card.back : card.front}
                </Text>
                <Text style={styles.hintText}>
                    {flipped ? "Tap to see Front" : "Tap to see Meaning"}
                </Text>
            </TouchableOpacity>

            {flipped && (
                <View style={styles.ratingContainer}>
                    <TouchableOpacity style={[styles.btn, styles.btnHard]} onPress={() => onReview(1)}>
                        <Text style={styles.btnText}>Hard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnGood]} onPress={() => onReview(3)}>
                        <Text style={styles.btnText}>Good</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnEasy]} onPress={() => onReview(5)}>
                        <Text style={styles.btnText}>Easy</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

/**
 * ==========================================
 * STYLES
 * ==========================================
 */
const styles = StyleSheet.create({
    // Badge
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE4E6', // Light pink
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FDA4AF',
    },
    fireIcon: { fontSize: 16, marginRight: 4 },
    streakText: { fontWeight: 'bold', color: '#BE123C', fontSize: 14 },

    // Card
    cardContainer: {
        width: '100%',
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFace: {
        width: '90%',
        height: 200,
        backgroundColor: 'white',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    cardText: { fontSize: 32, fontWeight: 'bold', color: '#1F2937' },
    hintText: { marginTop: 10, color: '#9CA3AF', fontSize: 12 },

    // Ratings
    ratingContainer: { flexDirection: 'row', gap: 10, width: '90%', justifyContent: 'space-between' },
    btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
    btnHard: { backgroundColor: '#EF4444' },
    btnGood: { backgroundColor: '#F59E0B' },
    btnEasy: { backgroundColor: '#10B981' },
    btnText: { color: 'white', fontWeight: 'bold' },
});