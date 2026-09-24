import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Alert,
    Platform,
    ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useGamification } from '../features/GamificationFeatures';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import analyticsService from '../services/analyticsService';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Logger from '../utils/logger';
import sfxService from '../services/sfxService';
import leagueService from '../services/leagueService';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';
// Note: Using stats.xp from useGamification for consistent XP display across the app

const { width } = Dimensions.get('window');

const ReviewSessionScreen = ({ navigation }) => {
    const { dueCards, submitReview, stats } = useGamification();
    const { userProfile } = useApp();
    const { colors, isDarkMode } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    // Generate unique session ID for this review session (to prevent duplicate rewards)
    const reviewSessionId = useRef(`review_${Date.now()}_${Math.random().toString(36).substring(7)}`).current;

    // Capture initial XP at session start by fetching directly from Firestore
    // This prevents the issue where stats.xp from useGamification isn't loaded yet
    const initialXPRef = useRef(null);

    // Fetch initial XP directly from Firestore on mount (before any reviews can change it)
    useEffect(() => {
        const fetchInitialXP = async () => {
            try {
                const user = auth().currentUser;
                if (!user) {
                    Logger.warn('[ReviewSession] No user logged in, defaulting XP to 0');
                    initialXPRef.current = 0;
                    return;
                }

                const userDoc = await firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const xp = userDoc.data()?.xp || 0;
                    initialXPRef.current = xp;
                    Logger.info('[ReviewSession] Fetched initial XP from Firestore:', xp);
                } else {
                    Logger.warn('[ReviewSession] User document not found, defaulting XP to 0');
                    initialXPRef.current = 0;
                }
            } catch (error) {
                Logger.error('[ReviewSession] Failed to fetch initial XP:', error);
                // Fallback to stats if available
                initialXPRef.current = stats?.xp || 0;
            }
        };

        fetchInitialXP();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount - stats?.xp is only used as fallback

    // Track screen mount
    useEffect(() => {
        Logger.breadcrumb('Review session started', { cardCount: dueCards?.length || 0 });
    }, []);

    // Animations
    const cardAnimX = useRef(new Animated.Value(0)).current;
    const cardAnimOpacity = useRef(new Animated.Value(1)).current;
    const cardAnimScale = useRef(new Animated.Value(1)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for the card
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Track previous index to only reset when moving to a new card
    const prevIndexRef = useRef(currentIndex);

    // Reset card animation only when index actually changes
    useEffect(() => {
        // Only reset if we're moving to a different card
        if (prevIndexRef.current !== currentIndex) {
            cardAnimX.setValue(0);
            cardAnimOpacity.setValue(1);
            cardAnimScale.setValue(1);
            setFlipped(false);
            flipAnim.setValue(0);
            prevIndexRef.current = currentIndex;
        }
    }, [currentIndex]);

    const handleFlip = () => {
        // Play flip sound
        sfxService.playFlip();

        if (!flipped) {
            // Flip to back
            Animated.timing(flipAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Flip to front
            Animated.timing(flipAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
        setFlipped(!flipped);
    };

    const handleReview = async (quality) => {
        const currentCard = dueCards[currentIndex];
        if (!currentCard) {
            return;
        }

        // Play rating sound effect
        if (quality === 1) {
            sfxService.playHard();
        } else if (quality === 3) {
            sfxService.playModerate();
        } else if (quality === 5) {
            sfxService.playEasy();
        }

        const qualityLabels = { 1: 'Hard', 3: 'Good', 5: 'Easy' };
        Logger.breadcrumb('User rated vocabulary card', {
            rating: qualityLabels[quality],
            cardNumber: currentIndex + 1,
            totalCards: dueCards.length
        });

        // Animate card out
        Animated.parallel([
            Animated.timing(cardAnimX, {
                toValue: quality >= 3 ? width : -width, // Swipe right for good/easy, left for hard
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(cardAnimOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(cardAnimScale, {
                toValue: 0.8,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(async () => {
            // Submit the review
            await submitReview(currentCard.wordId, quality);

            const newReviewedCount = reviewedCount + 1;
            setReviewedCount(newReviewedCount);

            // Move to next card or complete
            if (currentIndex + 1 < dueCards.length) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // All cards reviewed - navigate to SessionComplete
                Logger.breadcrumb('Review session completed', { cardsReviewed: newReviewedCount });

                // Calculate XP - direct points per question (no streak multiplier)
                const earnedXP = newReviewedCount * 10; // 10 XP per card

                Logger.info(`[REVIEW] XP calculated: ${earnedXP} total (${newReviewedCount} cards × 10 XP)`);

                const timeSpent = Math.ceil((newReviewedCount * 30) / 60); // Estimate 30 seconds per card

                // Grant review rewards from backend
                let earnedGems = 0;
                let sessionAlreadyRewarded = false;

                const user = auth().currentUser;
                if (user) {
                    try {
                        // Use unique reviewSessionId to prevent duplicate rewards
                        const rewardsResult = await analyticsService.grantSessionRewards(
                            user.uid,
                            'review',
                            reviewSessionId
                        );

                        if (rewardsResult && rewardsResult.success) {
                            earnedGems = rewardsResult.gemsAwarded;
                        } else if (rewardsResult && rewardsResult.alreadyRewarded) {
                            sessionAlreadyRewarded = true;
                        }
                    } catch (err) {
                        Logger.error('Failed to grant review rewards', err);
                    }
                }

                // If session was already rewarded, don't show SessionComplete modal
                if (sessionAlreadyRewarded) {
                    Alert.alert(
                        'ℹ️ Session Already Completed',
                        'You\'ve already received rewards for this review session. Great work!',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    setTimeout(() => {
                                        navigation.replace('Home');
                                    }, 300);
                                }
                            }
                        ]
                    );
                    return;
                }

                setTimeout(() => {
                    try {
                        navigation.replace('SessionComplete', {
                            previousXP: initialXPRef.current ?? stats?.xp ?? 0,
                            earnedXP,
                            earnedGems,
                            messagesSent: 0, // Not applicable for review
                            timeSpent,
                            streakIncreased: false,
                            reviewMode: true,
                            cardsReviewed: newReviewedCount,
                        });
                    } catch (navError) {
                        Logger.error('Review session navigation failed', navError);
                        // Fallback: try regular navigate
                        try {
                            navigation.navigate('SessionComplete', {
                                previousXP: initialXPRef.current ?? stats?.xp ?? 0,
                                earnedXP,
                                earnedGems,
                                messagesSent: 0,
                                timeSpent,
                                streakIncreased: false,
                                reviewMode: true,
                                cardsReviewed: newReviewedCount,
                            });
                        } catch (fallbackError) {
                            Logger.error('Review session fallback navigation failed', fallbackError);
                            Alert.alert(
                                '✅ Review Complete!',
                                `Great job! You reviewed ${newReviewedCount} cards and earned ${earnedXP} XP.`,
                                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                            );
                        }
                    }
                }, 100); // Reduced timeout
            }
        });
    };

    // Dynamic styles based on theme
    const dynamicStyles = {
        container: {
            // No background color - let ImageBackground show through with overlay
        },
        headerGradient: isDarkMode
            ? ['rgba(127, 82, 224, 0.9)', 'rgba(100, 60, 180, 0.85)']
            : ['rgba(106, 17, 203, 0.85)', 'rgba(37, 117, 252, 0.8)'],
        // Glassy card backgrounds
        cardBackground: isDarkMode
            ? 'rgba(30, 30, 40, 0.85)'
            : 'rgba(255, 255, 255, 0.88)',
        cardBackBackground: isDarkMode
            ? 'rgba(40, 40, 55, 0.9)'
            : 'rgba(240, 249, 255, 0.92)',
        textPrimary: isDarkMode ? '#FFF' : colors.text,
        textSecondary: isDarkMode ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
        textTertiary: isDarkMode ? 'rgba(255,255,255,0.6)' : colors.textTertiary,
        progressBg: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
    };

    // No cards remaining - Empty State
    // **CRITICAL FIX**: Also check if currentIndex is beyond array length
    // State to track if we are already navigating to completion
    const [isNavigating, setIsNavigating] = useState(false);

    // Handle auto-navigation when session is complete
    useEffect(() => {
        if ((!dueCards || dueCards.length === 0 || currentIndex >= dueCards.length) && reviewedCount > 0 && !isNavigating) {
            const navigateToComplete = async () => {
                setIsNavigating(true);

                const timeSpent = Math.ceil((reviewedCount * 30) / 60);

                // XP is already awarded per-card in processReviewBatch (10 XP per card)
                // This is just for display purposes
                const earnedXP = reviewedCount * 10;

                Logger.info(`[REVIEW] Session complete: ${reviewedCount} cards, ${earnedXP} XP`);

                // Award stars for league ranking
                if (earnedXP > 0) {
                    leagueService.earnStars(earnedXP, userProfile);
                }

                // Mark session as completed (for gems only, XP already awarded per card)
                let earnedGems = 0;
                const user = auth().currentUser;
                if (user) {
                    try {
                        const rewardsResult = await analyticsService.grantSessionRewards(
                            user.uid,
                            'review',
                            reviewSessionId
                        );
                        if (rewardsResult && rewardsResult.success) {
                            earnedGems = rewardsResult.gemsAwarded || 0;
                        }
                    } catch (err) {
                        Logger.error('Failed to grant review rewards', err);
                    }

                    // Fetch fresh XP from Firestore to get accurate previousXP
                    try {
                        const userDoc = await require('@react-native-firebase/firestore').default
                            .collection('users')
                            .doc(user.uid)
                            .get();

                        if (userDoc.exists) {
                            const currentXP = userDoc.data()?.xp || 0;
                            // previousXP = currentXP - earnedXP (XP was already awarded per-card)
                            // Use fresh Firestore XP for accurate calculation
                            navigation.replace('SessionComplete', {
                                previousXP: initialXPRef.current ?? stats?.xp ?? 0,
                                earnedXP,
                                earnedGems,
                                messagesSent: 0,
                                timeSpent,
                                streakIncreased: false,
                                reviewMode: true,
                                cardsReviewed: reviewedCount,
                            });
                            return;
                        }
                    } catch (err) {
                        Logger.error('Failed to fetch fresh XP', err);
                    }
                }

                // Fallback if user fetch fails - use stats.xp for consistency
                navigation.replace('SessionComplete', {
                    previousXP: initialXPRef.current ?? stats?.xp ?? 0,
                    earnedXP,
                    earnedGems,
                    messagesSent: 0,
                    timeSpent,
                    streakIncreased: false,
                    reviewMode: true,
                    cardsReviewed: reviewedCount,
                });
            };

            navigateToComplete();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dueCards, currentIndex, reviewedCount, isNavigating, navigation, reviewSessionId, userProfile]);

    // Handle session end (e.g. back to home)
    const handleSessionEnd = () => {
        navigation.navigate('Home');
    };

    // No cards remaining - Empty State
    // **CRITICAL FIX**: Also check if currentIndex is beyond array length
    if (!dueCards || dueCards.length === 0 || currentIndex >= dueCards.length) {
        // If user reviewed cards in this session, show loading while navigating
        if (reviewedCount > 0) {
            return (
                <ImageBackground
                    source={GAME_BACKGROUNDS.SESSION_REVIEW}
                    style={styles.container}
                    resizeMode="cover"
                >
                    <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
                        <StatusBar
                            barStyle="light-content"
                            backgroundColor={isDarkMode ? colors.primaryDark : '#6A11CB'}
                        />
                        <Text style={{ fontSize: 24, marginBottom: 10, textAlign: 'center' }}>🎉</Text>
                        <Text style={{ fontSize: 16, color: '#FFF', textAlign: 'center' }}>Calculating rewards...</Text>
                    </View>
                </ImageBackground>
            );
        }

        // Only show "All caught up" when user enters with 0 cards to review
        return (
            <ImageBackground
                source={GAME_BACKGROUNDS.SESSION_REVIEW}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <StatusBar
                        barStyle="light-content"
                        backgroundColor={isDarkMode ? colors.primaryDark : '#6A11CB'}
                    />
                    <LinearGradient
                        colors={dynamicStyles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <SafeAreaView style={styles.safeHeader}>
                            <View style={styles.headerContent}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => navigation.goBack()}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Icon name="arrow-back" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Vocabulary Review</Text>
                                <View style={{ width: 40 }} />
                            </View>
                        </SafeAreaView>
                    </LinearGradient>

                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                            <Text style={styles.emptyIcon}>🎉</Text>
                        </View>
                        <Text style={[styles.emptyTitle, { color: '#FFF' }]}>
                            You're All Caught Up!
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                            {reviewedCount > 0
                                ? `You reviewed ${reviewedCount} card${reviewedCount > 1 ? 's' : ''}!\nGreat progress! 🌟`
                                : 'No words to review right now.\nCome back later when more are due!'}
                        </Text>
                        <TouchableOpacity
                            style={styles.finishButton}
                            onPress={handleSessionEnd}
                        >
                            <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.finishButtonGradient}
                            >
                                <Text style={styles.finishButtonText}>
                                    {reviewedCount > 0 ? 'Claim Rewards' : 'Back to Home'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        );
    }

    const currentCard = dueCards[currentIndex];
    const progress = ((currentIndex + 1) / dueCards.length) * 100;

    // Flip interpolation
    const frontRotation = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backRotation = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    return (
        <ImageBackground
            source={GAME_BACKGROUNDS.SESSION_REVIEW}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={[styles.overlay, dynamicStyles.container]}>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={isDarkMode ? colors.primaryDark : '#6A11CB'}
                />

                {/* Header with proper SafeAreaView */}
                <LinearGradient
                    colors={dynamicStyles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <SafeAreaView style={styles.safeHeader}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Icon name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.titleContainer}>
                                <Text style={styles.headerTitle}>Vocabulary Review</Text>
                                <View style={styles.cardCountBadge}>
                                    <Icon name="layers-outline" size={14} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.headerSubtitle}>
                                        {currentIndex + 1} / {dueCards.length}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ width: 40 }} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Progress Bar */}
                <View style={[styles.progressBarContainer, { backgroundColor: dynamicStyles.progressBg }]}>
                    <LinearGradient
                        colors={['#10B981', '#34D399']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                    />
                </View>

                {/* Flashcard */}
                <View style={styles.cardContainer}>
                    {currentCard && (
                        <Animated.View
                            style={[
                                styles.animatedCardContainer,
                                {
                                    opacity: cardAnimOpacity,
                                    transform: [
                                        { translateX: cardAnimX },
                                        { scale: Animated.multiply(cardAnimScale, pulseAnim) },
                                    ],
                                },
                            ]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.95}
                                onPress={handleFlip}
                                style={styles.cardTouchable}
                            >
                                {/* Front of Card */}
                                <Animated.View
                                    style={[
                                        styles.cardFace,
                                        styles.cardFront,
                                        {
                                            backgroundColor: dynamicStyles.cardBackground,
                                            opacity: frontOpacity,
                                            transform: [{ rotateY: frontRotation }],
                                            borderColor: isDarkMode ? colors.border : 'transparent',
                                            borderWidth: isDarkMode ? 1 : 0,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardDecoration}>
                                        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: isDarkMode ? 'rgba(157, 101, 255, 0.1)' : 'rgba(106, 17, 203, 0.05)' }]} />
                                        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: isDarkMode ? 'rgba(157, 101, 255, 0.08)' : 'rgba(37, 117, 252, 0.05)' }]} />
                                    </View>
                                    <View style={styles.cardLabelContainer}>
                                        <Icon name="text-outline" size={16} color={colors.primary} />
                                        <Text style={[styles.cardLabel, { color: colors.primary }]}>WORD</Text>
                                    </View>
                                    <Text style={[styles.cardText, { color: dynamicStyles.textPrimary }]}>
                                        {currentCard.front}
                                    </Text>
                                    <View style={styles.tapHint}>
                                        <View style={[styles.tapHintBadge, { backgroundColor: isDarkMode ? colors.surfaceElevated : '#F3F4F6' }]}>
                                            <Icon name="sync-outline" size={18} color={dynamicStyles.textTertiary} />
                                            <Text style={[styles.hintText, { color: dynamicStyles.textTertiary }]}>
                                                Tap to reveal translation
                                            </Text>
                                        </View>
                                    </View>
                                </Animated.View>

                                {/* Back of Card */}
                                <Animated.View
                                    style={[
                                        styles.cardFace,
                                        styles.cardBack,
                                        {
                                            backgroundColor: dynamicStyles.cardBackBackground,
                                            opacity: backOpacity,
                                            transform: [{ rotateY: backRotation }],
                                            borderColor: isDarkMode ? colors.border : 'transparent',
                                            borderWidth: isDarkMode ? 1 : 0,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardDecoration}>
                                        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]} />
                                        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.08)' : 'rgba(16, 185, 129, 0.05)' }]} />
                                    </View>
                                    <View style={styles.cardLabelContainer}>
                                        <Icon name="language-outline" size={16} color="#10B981" />
                                        <Text style={[styles.cardLabel, { color: '#10B981' }]}>TRANSLATION</Text>
                                    </View>
                                    <Text style={[styles.cardText, { color: dynamicStyles.textPrimary }]}>
                                        {currentCard.back}
                                    </Text>
                                    <View style={styles.tapHint}>
                                        <View style={[styles.tapHintBadge, { backgroundColor: isDarkMode ? colors.surface : '#E5E7EB' }]}>
                                            <Icon name="checkmark-circle-outline" size={18} color="#10B981" />
                                            <Text style={[styles.hintText, { color: dynamicStyles.textSecondary }]}>
                                                Rate your recall below
                                            </Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>

                            {/* Rating Buttons - Only show when flipped */}
                            {flipped && (
                                <Animated.View
                                    style={[
                                        styles.ratingContainer,
                                        { opacity: backOpacity }
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnHard]}
                                        onPress={() => handleReview(1)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['rgba(239, 68, 68, 0.95)', 'rgba(185, 28, 28, 0.9)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.btnGradient}
                                        >
                                            <Icon name="close-circle" size={26} color="#FFF" />
                                            <Text style={styles.btnText}>Hard</Text>
                                            <Text style={styles.btnSubtext}>1 day</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnGood]}
                                        onPress={() => handleReview(3)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['rgba(251, 191, 36, 0.95)', 'rgba(217, 119, 6, 0.9)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.btnGradient}
                                        >
                                            <Icon name="checkmark-circle" size={26} color="#FFF" />
                                            <Text style={styles.btnText}>Good</Text>
                                            <Text style={styles.btnSubtext}>3 days</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnEasy]}
                                        onPress={() => handleReview(5)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['rgba(16, 185, 129, 0.95)', 'rgba(5, 150, 105, 0.9)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.btnGradient}
                                        >
                                            <Icon name="checkmark-done-circle" size={26} color="#FFF" />
                                            <Text style={styles.btnText}>Easy</Text>
                                            <Text style={styles.btnSubtext}>7 days</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </Animated.View>
                    )}
                </View>

                {/* Bottom instruction */}
                {!flipped && (
                    <View style={styles.bottomInstruction}>
                        <View style={styles.instructionPill}>
                            <Text style={styles.instructionText}>
                                Try to recall the translation before tapping
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    header: {
        paddingBottom: 20,
    },
    safeHeader: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        textAlign: 'center',
    },
    cardCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
        gap: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 6,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    animatedCardContainer: {
        width: '100%',
        alignItems: 'center',
    },
    cardTouchable: {
        width: '100%',
        height: 320,
        marginBottom: 30,
    },
    cardFace: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 16,
        backfaceVisibility: 'hidden',
        padding: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    cardFront: {
        // Front specific styles
    },
    cardBack: {
        // Back specific styles
    },
    cardDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
    },
    decorCircle1: {
        width: 200,
        height: 200,
        top: -60,
        right: -60,
    },
    decorCircle2: {
        width: 150,
        height: 150,
        bottom: -40,
        left: -40,
    },
    cardLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cardText: {
        fontSize: 38,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 20,
    },
    tapHint: {
        position: 'absolute',
        bottom: 24,
    },
    tapHintBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    hintText: {
        fontSize: 14,
        fontWeight: '500',
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    btnGradient: {
        paddingVertical: 14,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    btnHard: {},
    btnGood: {},
    btnEasy: {},
    btnEmoji: {
        fontSize: 24,
        marginBottom: 2,
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    btnSubtext: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyIcon: {
        fontSize: 80,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    finishButton: {
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#6A11CB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    finishButtonGradient: {
        paddingHorizontal: 48,
        paddingVertical: 18,
    },
    finishButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    bottomInstruction: {
        paddingBottom: 30,
        alignItems: 'center',
    },
    instructionPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    instructionText: {
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'italic',
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

export default ReviewSessionScreen;
