import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Alert,
    ScrollView,
    ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Logger from '../utils/logger';
import { useApp } from '../contexts/AppContext';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';

const { width } = Dimensions.get('window');

// Use memo to prevent unnecessary re-renders
const SessionCompleteScreen = memo(({ navigation, route }) => {
    const hasNavigated = useRef(false);
    const renderCount = useRef(0);

    // Track render count
    renderCount.current++;

    // Log component mount once
    useEffect(() => {
        Logger.breadcrumb('Session complete screen viewed');
    }, []);

    // Use focus effect to prevent multiple effects running on remount
    useFocusEffect(
        useCallback(() => {
            if (!hasNavigated.current) {
                // Return cleanup to set has navigated when screen loses focus
                return () => {
                    hasNavigated.current = true;
                };
            }
        }, [])
    );
    // Memoize context to prevent re-renders
    const { currentStreak } = useApp();
    const memoizedStreak = useRef(currentStreak);

    // Only update streak ref on mount
    useEffect(() => {
        memoizedStreak.current = currentStreak;
    }, []);

    // Get params or use mock data
    const previousXP = route.params?.previousXP ?? 150;
    const earnedXP = route.params?.earnedXP || 45;
    const earnedGems = route.params?.earnedGems || 0;
    const messagesSent = route.params?.messagesSent || 12;
    const timeSpent = route.params?.timeSpent || 8; // minutes
    const streakIncreased = route.params?.streakIncreased || true;

    // State for bonus XP from double ad
    const [bonusXP, setBonusXP] = useState(0);
    const totalEarnedXP = earnedXP + bonusXP;
    const newXP = previousXP + totalEarnedXP;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const xpBarAnim = useRef(new Animated.Value(0)).current;
    const streakScaleAnim = useRef(new Animated.Value(1)).current;

    // Use Animated.Value for XP to avoid re-renders
    const animatedXP = useRef(new Animated.Value(previousXP)).current;
    const [displayedXP, setDisplayedXP] = useState(previousXP);

    // Only run animations once on mount
    const animationsStarted = useRef(false);

    useEffect(() => {
        // Prevent running animations multiple times
        if (animationsStarted.current) {
            return;
        }

        animationsStarted.current = true;

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // XP bar animation (starts after 500ms)
        setTimeout(() => {
            Animated.timing(xpBarAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false,
            }).start();

            // Animate XP number - only update state at end to avoid re-renders
            Animated.timing(animatedXP, {
                toValue: newXP,
                duration: 1500,
                useNativeDriver: false,
            }).start(() => {
                // Only update state once at the end
                setDisplayedXP(newXP);
            });
        }, 500);

        // Streak animation (if increased)
        if (streakIncreased) {
            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(streakScaleAnim, {
                        toValue: 1.3,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(streakScaleAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 5,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, 2200);
        }
    }, []);

    // Handle double XP bonus
    const handleDoubleXP = useCallback((bonus) => {
        Logger.info('[SESSION_COMPLETE] XP doubled!', { bonus, previousDisplayed: displayedXP });
        setBonusXP(bonus);

        // Animate to new doubled XP value
        const newTotalXP = previousXP + earnedXP + bonus;
        Animated.timing(animatedXP, {
            toValue: newTotalXP,
            duration: 800,
            useNativeDriver: false,
        }).start(() => {
            setDisplayedXP(newTotalXP);
        });
    }, [displayedXP, previousXP, earnedXP, animatedXP]);

    const xpBarWidth = xpBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <ImageBackground
            source={GAME_BACKGROUNDS.SESSION_REVIEW}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Content */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerIconContainer}>
                                    <Icon name="checkmark-circle" size={56} color="#10B981" />
                                </View>
                                <Text style={styles.title}>Session Complete!</Text>
                                <Text style={styles.subtitle}>Great job practicing!</Text>
                            </View>

                            {/* Stats Cards */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Icon name="chatbubble-outline" size={28} color="#60A5FA" />
                                    <Text style={styles.statValue}>{messagesSent}</Text>
                                    <Text style={styles.statLabel}>Messages</Text>
                                </View>

                                <View style={styles.statCard}>
                                    <Icon name="time-outline" size={28} color="#F59E0B" />
                                    <Text style={styles.statValue}>{timeSpent}</Text>
                                    <Text style={styles.statLabel}>Minutes</Text>
                                </View>

                                <View style={styles.statCard}>
                                    <Icon name="star" size={28} color="#FFD700" />
                                    <Text style={styles.statValue}>+{earnedXP}</Text>
                                    <Text style={styles.statLabel}>XP Earned</Text>
                                </View>

                                {earnedGems > 0 && (
                                    <View style={styles.statCard}>
                                        <Icon name="diamond" size={28} color="#A78BFA" />
                                        <Text style={styles.statValue}>+{earnedGems}</Text>
                                        <Text style={styles.statLabel}>Gems</Text>
                                    </View>
                                )}
                            </View>

                            {/* XP Progress Section */}
                            <View style={styles.xpSection}>
                                <View style={styles.xpHeader}>
                                    <Text style={styles.xpLabel}>Experience Points</Text>
                                    <Text style={styles.xpValue}>{displayedXP} XP</Text>
                                </View>

                                {/* XP Bar */}
                                <View style={styles.xpBarContainer}>
                                    <View style={styles.xpBarBackground}>
                                        <Animated.View style={[styles.xpBarFill, { width: xpBarWidth }]}>
                                            <LinearGradient
                                                colors={['#FFD700', '#FFA500', '#FF8C00']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.xpBarGradient}
                                            />
                                        </Animated.View>
                                    </View>

                                    {/* XP Labels */}
                                    <View style={styles.xpLabels}>
                                        <Text style={styles.xpLabelText}>{previousXP}</Text>
                                        <Text style={styles.xpLabelText}>{newXP}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Streak Badge Section */}
                            <View style={styles.streakSection}>
                                <View style={styles.streakTitleRow}>
                                    <Icon name="flame" size={24} color="#FF6B35" />
                                    <Text style={styles.streakTitle}>
                                        {streakIncreased ? ' Streak Increased!' : ' Keep Your Streak!'}
                                    </Text>
                                </View>
                                <Animated.View
                                    style={{
                                        transform: [{ scale: streakScaleAnim }],
                                    }}
                                >
                                    <View style={styles.streakBadgeContainer}>
                                        {/* Simple static streak badge */}
                                        <View style={styles.simpleBadge}>
                                            <Icon name="flame" size={28} color="#BE123C" />
                                            <Text style={styles.streakCount}>{memoizedStreak.current || 1}</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                                {streakIncreased && (
                                    <Text style={styles.streakMessage}>
                                        Come back tomorrow to keep it going!
                                    </Text>
                                )}
                            </View>

                            {/* Double XP Button */}
                            <DoubleXPButton
                                baseXP={earnedXP}
                                onDoubled={handleDoubleXP}
                            />

                            {/* Continue Button */}
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={() => {
                                    if (hasNavigated.current) {
                                        return;
                                    }

                                    // Mark as navigated IMMEDIATELY
                                    hasNavigated.current = true;
                                    Logger.breadcrumb('User tapped continue on session complete');

                                    // SIMPLE NAVIGATION TO HOME
                                    setTimeout(() => {
                                        try {
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'Home' }],
                                            });
                                        } catch (err) {
                                            Logger.error('Session complete navigation failed', err);
                                            // Simple fallback
                                            try {
                                                navigation.navigate('Home');
                                            } catch (innerErr) {
                                                Logger.error('Session complete fallback navigation failed', innerErr);
                                                Alert.alert('Navigation Error', 'Please tap the back button to go home.');
                                            }
                                        }
                                    }, 500);
                                }}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['rgba(106, 17, 203, 0.9)', 'rgba(37, 117, 252, 0.85)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.continueButtonGradient}
                                >
                                    <Text style={styles.continueButtonText}>Continue</Text>
                                    <Icon name="arrow-forward" size={24} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </ImageBackground>
    );
});

// Double XP Button Component
const DoubleXPButton = memo(({ baseXP, onDoubled }) => {
    const [claimed, setClaimed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { useGamification } = require('../features/GamificationFeatures');
    const { earnXP } = useGamification();

    const handlePress = async () => {
        if (claimed || loading) return;

        setLoading(true);
        try {
            const rewardedAdService = require('../services/rewardedAdService').default;
            const success = await rewardedAdService.showAd(
                'DOUBLE_XP',
                () => {
                    setClaimed(true);
                    if (earnXP) {
                        earnXP(baseXP); // Award bonus XP
                    }
                    if (onDoubled) {
                        onDoubled(baseXP);
                    }
                },
                () => { },
                () => {
                    Alert.alert('Ad Error', 'Could not load ad. Please try again.');
                }
            );
            if (!success) {
                rewardedAdService.loadAd('DOUBLE_XP');
                Alert.alert('Loading', 'Ad is loading, please try again in a moment.');
            }
        } catch (error) {
            Logger.error('Double XP ad error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (claimed) {
        return (
            <View style={styles.doubleXpSuccess}>
                <Icon name="sparkles" size={20} color="#A78BFA" />
                <Text style={styles.doubleXpSuccessText}> XP Doubled! +{baseXP} bonus</Text>
            </View>
        );
    }

    return (
        <>
            <TouchableOpacity
                style={[styles.doubleXpButton, loading && { opacity: 0.6 }]}
                onPress={handlePress}
                disabled={loading}
            >
                <Icon name="play-circle" size={22} color="#FFF" />
                <Text style={styles.doubleXpButtonText}>
                    {loading ? 'Loading...' : ' Watch Ad for x2 XP'}
                </Text>
            </TouchableOpacity>
            {/* FAMILIES POLICY CONSENT NOTICE */}
            <Text style={styles.adConsentNotice}>
                You can close the ad after 5 seconds, but you won't receive the reward if you close early.
            </Text>
        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    content: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
    },
    xpSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    xpLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    xpValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFD700',
    },
    xpBarContainer: {
        marginTop: 8,
    },
    xpBarBackground: {
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    xpBarGradient: {
        flex: 1,
    },
    xpLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    xpLabelText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
    },
    streakSection: {
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 12,
    },
    streakTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    streakTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    streakBadgeContainer: {
        marginBottom: 12,
    },
    simpleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 228, 230, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FDA4AF',
        gap: 8,
    },
    streakCount: {
        fontWeight: '800',
        color: '#BE123C',
        fontSize: 24,
    },
    streakMessage: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
        textAlign: 'center',
    },
    continueButton: {
        marginTop: 'auto',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#6A11CB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    continueButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 8,
    },
    continueButtonText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    doubleXpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginTop: 8,
        marginBottom: 12,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    doubleXpButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    doubleXpSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.25)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    doubleXpSuccessText: {
        color: '#A78BFA',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // FAMILIES POLICY: Consent notice for ads
    adConsentNotice: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
        fontStyle: 'italic',
    },
});

// Use default export with memo for optimal performance
export default SessionCompleteScreen;
