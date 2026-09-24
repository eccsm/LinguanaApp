import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useGamification } from '../features/GamificationFeatures';
import Haptics from '../utils/haptics';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';

const WAGER_DURATION_DAYS = 7;

// Wager tiers: amount -> reward (2x)
const WAGER_TIERS = [
    { amount: 25, reward: 50 },
    { amount: 50, reward: 100 },
    { amount: 100, reward: 200 },
    { amount: 200, reward: 400 },
];

const WagerCard = ({ onWagerStart, onWagerComplete }) => {
    const { colors, isDarkMode } = useTheme();
    const { stats } = useGamification();
    const [wagerStatus, setWagerStatus] = useState(null); // null | 'active' | 'success' | 'failed'
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [activeWagerReward, setActiveWagerReward] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));
    const [selectedTierIndex, setSelectedTierIndex] = useState(1); // Default to 50 gems

    const user = auth().currentUser;
    // Get gems from gamification stats
    const userGems = stats?.gems ?? 0;
    const currentStreak = stats?.currentStreak ?? 0;

    // Get available tiers based on user's gems
    const availableTiers = WAGER_TIERS.filter(tier => tier.amount <= userGems);
    const selectedTier = WAGER_TIERS[selectedTierIndex] || WAGER_TIERS[0];
    const canAfford = userGems >= selectedTier.amount;

    // Fetch wager status from Firestore
    useEffect(() => {
        if (!user) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(user.uid)
            .onSnapshot((doc) => {
                const data = doc.data();
                const activeWager = data?.activeWager;

                if (activeWager) {
                    const startDate = activeWager.startDate?.toDate();
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + WAGER_DURATION_DAYS);
                    const now = new Date();

                    if (now > endDate) {
                        // Wager period ended - check result
                        if (activeWager.status === 'active') {
                            // Check if streak was maintained
                            checkWagerResult(activeWager);
                        }
                    } else {
                        // Wager still active
                        const remaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                        setDaysRemaining(remaining);
                        setActiveWagerReward(activeWager.reward || activeWager.amount * 2);
                        setWagerStatus(activeWager.status);
                    }
                } else {
                    setWagerStatus(null);
                }
            });

        return () => unsubscribe();
    }, [user]);

    // Pulse animation for active wager
    useEffect(() => {
        if (wagerStatus === 'active') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [wagerStatus]);

    const checkWagerResult = async (wager) => {
        try {
            const userRef = firestore().collection('users').doc(user.uid);
            const currentData = (await userRef.get()).data();
            const wasStreakMaintained = currentData.currentStreak >= wager.startStreak;

            if (wasStreakMaintained) {
                // SUCCESS - Award double gems
                await userRef.update({
                    gems: firestore.FieldValue.increment(WAGER_REWARD),
                    activeWager: firestore.FieldValue.delete(),
                    'wagerHistory': firestore.FieldValue.arrayUnion({
                        result: 'success',
                        amount: WAGER_AMOUNT,
                        reward: WAGER_REWARD,
                        date: new Date().toISOString(),
                    }),
                });
                setWagerStatus('success');
                onWagerComplete?.({ success: true, reward: WAGER_REWARD });
                Haptics.success();
            } else {
                // FAILED - Streak was broken
                await userRef.update({
                    activeWager: firestore.FieldValue.delete(),
                    'wagerHistory': firestore.FieldValue.arrayUnion({
                        result: 'failed',
                        amount: WAGER_AMOUNT,
                        date: new Date().toISOString(),
                    }),
                });
                setWagerStatus('failed');
                onWagerComplete?.({ success: false });
                Haptics.error();
            }
        } catch (error) {
            Logger.error('[WAGER] Check result failed:', error);
        }
    };

    const startWager = async () => {
        if (!canAfford) {
            Haptics.error();
            return;
        }

        setLoading(true);
        Haptics.medium();

        try {
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                gems: firestore.FieldValue.increment(-selectedTier.amount),
                activeWager: {
                    amount: selectedTier.amount,
                    reward: selectedTier.reward,
                    startDate: firestore.FieldValue.serverTimestamp(),
                    startStreak: currentStreak,
                    status: 'active',
                },
            });

            setWagerStatus('active');
            setDaysRemaining(WAGER_DURATION_DAYS);
            onWagerStart?.();
            Haptics.success();
        } catch (error) {
            Logger.error('[WAGER] Start failed:', error);
            Haptics.error();
        } finally {
            setLoading(false);
        }
    };

    // Render based on wager status
    if (wagerStatus === 'active') {
        return null; // Hide card when active (moved to StreakBadge/Modal)
    }

    // No active wager - show bet button
    return (
        <View>
            <LinearGradient
                colors={canAfford ? ['#8B5CF6', '#7C3AED'] : ['#6B7280', '#4B5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Icon name="dice-multiple" size={24} color="#FFF" />
                    <Text style={styles.title}>Double or Nothing</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.description}>
                        Keep your streak for 7 days to win!
                    </Text>

                    {/* Tier Selector */}
                    <View style={styles.tierSelector}>
                        {WAGER_TIERS.map((tier, index) => {
                            const canSelectTier = userGems >= tier.amount;
                            const isSelected = selectedTierIndex === index;
                            return (
                                <TouchableOpacity
                                    key={tier.amount}
                                    style={[
                                        styles.tierButton,
                                        isSelected && styles.tierButtonSelected,
                                        !canSelectTier && styles.tierButtonDisabled
                                    ]}
                                    onPress={() => canSelectTier && setSelectedTierIndex(index)}
                                    disabled={!canSelectTier}
                                >
                                    <Icon name="diamond-stone" size={14} color={isSelected ? '#FFD700' : (canSelectTier ? '#FFF' : '#666')} />
                                    <Text style={[
                                        styles.tierAmount,
                                        isSelected && styles.tierAmountSelected,
                                        !canSelectTier && styles.tierAmountDisabled
                                    ]}>
                                        {tier.amount}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.betDetails}>
                        <View style={styles.betItem}>
                            <Text style={styles.betLabel}>Wager</Text>
                            <View style={styles.betValue}>
                                <Icon name="diamond-stone" size={16} color="#EF4444" />
                                <Text style={[styles.betAmount, { color: '#EF4444' }]}>-{selectedTier.amount}</Text>
                            </View>
                        </View>

                        <Icon name="arrow-right" size={20} color="rgba(255,255,255,0.5)" />

                        <View style={styles.betItem}>
                            <Text style={styles.betLabel}>Win</Text>
                            <View style={styles.betValue}>
                                <Icon name="diamond-stone" size={16} color="#FFD700" />
                                <Text style={[styles.betAmount, { color: '#FFD700' }]}>+{selectedTier.reward}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionButton, !canAfford && styles.actionButtonDisabled]}
                        onPress={startWager}
                        disabled={!canAfford || loading}
                    >
                        <Text style={styles.actionText}>
                            {loading ? '...' : (canAfford ? '🎲 Place Bet!' : `Need ${selectedTier.amount - userGems} more gems`)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        marginLeft: 8,
    },
    content: {
        alignItems: 'center',
    },
    description: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 12,
    },
    betDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    betItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    betLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    betValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    betAmount: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 4,
    },
    actionButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginHorizontal: 4,
    },
    progressDotComplete: {
        backgroundColor: '#FFF',
    },
    progressDotPending: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    rewardPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    rewardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
        marginLeft: 6,
    },
    tierSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
    },
    tierButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        gap: 4,
    },
    tierButtonSelected: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    tierButtonDisabled: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tierAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    tierAmountSelected: {
        color: '#FFD700',
    },
    tierAmountDisabled: {
        color: '#666',
    },
});

export default WagerCard;
