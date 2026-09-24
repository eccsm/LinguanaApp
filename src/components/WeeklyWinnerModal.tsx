/**
 * WeeklyWinnerModal Component
 * Beautiful congratulations modal shown when user is a weekly puzzle winner
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Easing,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// ============================================================================
// Types
// ============================================================================

interface WeeklyReward {
    weekId: string;
    rank: number;
    gems: number;
    tier: 'gold' | 'silver' | 'bronze' | 'star' | 'medal';
    icon: string;
    title: string;
    score: number;
    awardedAt: string;
}

interface WeeklyWinnerModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** The pending reward data */
    reward: WeeklyReward | null;
    /** Callback when claim button is pressed */
    onClaim: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const TIER_COLORS = {
    gold: {
        gradient: ['#FFD700', '#FFA500', '#FF8C00'],
        text: '#8B6914',
        glow: 'rgba(255, 215, 0, 0.3)',
    },
    silver: {
        gradient: ['#E8E8E8', '#C0C0C0', '#A8A8A8'],
        text: '#4A4A4A',
        glow: 'rgba(192, 192, 192, 0.3)',
    },
    bronze: {
        gradient: ['#CD7F32', '#B87333', '#A0522D'],
        text: '#5C3D1E',
        glow: 'rgba(205, 127, 50, 0.3)',
    },
    star: {
        gradient: ['#4A90D9', '#357ABD', '#2E5A8B'],
        text: '#FFFFFF',
        glow: 'rgba(74, 144, 217, 0.3)',
    },
    medal: {
        gradient: ['#4CAF50', '#45A049', '#388E3C'],
        text: '#FFFFFF',
        glow: 'rgba(76, 175, 80, 0.3)',
    },
};

// ============================================================================
// Component
// ============================================================================

export default function WeeklyWinnerModal({
    visible,
    reward,
    onClaim,
}: WeeklyWinnerModalProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const gemBounce = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
            glowAnim.setValue(0);

            // Scale in with bounce
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 100,
                useNativeDriver: true,
            }).start();

            // Trophy rotation wiggle
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 200,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: -1,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 200,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Glow pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1000,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Gem bounce
            Animated.loop(
                Animated.sequence([
                    Animated.timing(gemBounce, {
                        toValue: 1.2,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(gemBounce, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    if (!reward) return null;

    const tierColors = TIER_COLORS[reward.tier] || TIER_COLORS.medal;

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-5deg', '0deg', '5deg'],
    });

    const formatWeekDates = (weekId: string) => {
        try {
            const monday = new Date(weekId);
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);

            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
        } catch {
            return weekId;
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        },
                    ]}
                >
                    {/* Glow effect */}
                    <Animated.View
                        style={[
                            styles.glowEffect,
                            {
                                backgroundColor: tierColors.glow,
                                opacity: glowAnim,
                            },
                        ]}
                    />

                    {/* Trophy/Badge Section */}
                    <Animated.View
                        style={[
                            styles.trophyContainer,
                            { transform: [{ rotate }] },
                        ]}
                    >
                        <LinearGradient
                            colors={tierColors.gradient}
                            style={styles.trophyBadge}
                        >
                            <Text style={styles.trophyIcon}>{reward.icon}</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Title */}
                    <Text style={[styles.title, isDark && styles.titleDark]}>
                        {reward.title}
                    </Text>

                    {/* Rank Badge */}
                    <View style={[styles.rankBadge, { backgroundColor: tierColors.gradient[0] }]}>
                        <Text style={[styles.rankText, { color: tierColors.text }]}>
                            #{reward.rank}
                        </Text>
                    </View>

                    {/* Week Info */}
                    <Text style={[styles.weekText, isDark && styles.weekTextDark]}>
                        Week of {formatWeekDates(reward.weekId)}
                    </Text>

                    {/* Score */}
                    <View style={styles.scoreContainer}>
                        <Icon name="star" size={20} color="#FFD700" />
                        <Text style={[styles.scoreText, isDark && styles.scoreTextDark]}>
                            {reward.score.toLocaleString()} points
                        </Text>
                    </View>

                    {/* Gem Reward */}
                    <View style={styles.rewardContainer}>
                        <Text style={[styles.rewardLabel, isDark && styles.rewardLabelDark]}>
                            You earned
                        </Text>
                        <Animated.View
                            style={[
                                styles.gemContainer,
                                { transform: [{ scale: gemBounce }] },
                            ]}
                        >
                            <Icon name="diamond-stone" size={32} color="#00D4FF" />
                            <Text style={styles.gemAmount}>+{reward.gems}</Text>
                        </Animated.View>
                        <Text style={[styles.gemLabel, isDark && styles.gemLabelDark]}>
                            Gems
                        </Text>
                    </View>

                    {/* Claim Button */}
                    <TouchableOpacity
                        style={styles.claimButton}
                        onPress={onClaim}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.claimButtonGradient}
                        >
                            <Text style={styles.claimButtonText}>Claim Reward</Text>
                            <Icon name="check-circle" size={22} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
        overflow: 'hidden',
    },
    glowEffect: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        top: -50,
    },
    trophyContainer: {
        marginBottom: 16,
    },
    trophyBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    trophyIcon: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    titleDark: {
        color: '#FFFFFF',
    },
    rankBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    rankText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    weekText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    weekTextDark: {
        color: '#AAA',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    scoreText: {
        fontSize: 16,
        color: '#444',
        fontWeight: '600',
    },
    scoreTextDark: {
        color: '#CCC',
    },
    rewardContainer: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 16,
    },
    rewardLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    rewardLabelDark: {
        color: '#AAA',
    },
    gemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gemAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#00D4FF',
    },
    gemLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    gemLabelDark: {
        color: '#AAA',
    },
    claimButton: {
        width: '100%',
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    claimButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
