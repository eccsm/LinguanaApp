import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Animated,
    PanResponder,
    Platform,
    ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import Haptics from '../utils/haptics';
import { useGamification } from '../features/GamificationFeatures';
import sfxService from '../services/sfxService';
import leagueService from '../services/leagueService';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const SpeedSwipeScreen = ({ navigation }) => {
    const { user, userProfile } = useApp();
    const { colors, isDarkMode } = useTheme();
    const { earnXP } = useGamification();

    // Game State
    const [gameState, setGameState] = useState('intro'); // intro, playing, summary
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Double XP state (must be at top level, not inside conditional)
    const [doubleXpClaimed, setDoubleXpClaimed] = useState(false);
    const [adLoading, setAdLoading] = useState(false);

    // Animation Values
    const position = useRef(new Animated.ValueXY()).current;
    const nextCardScale = useRef(new Animated.Value(0.9)).current;

    // Timer Ref
    const timerRef = useRef(null);

    // Score ref to avoid stale closure issues
    const scoreRef = useRef(0);

    // Fetch words and prepare deck from backend API
    const fetchWords = async () => {
        setLoading(true);
        try {
            // Get user's target language (default to Spanish)
            const targetLanguage = userProfile?.targetLanguage || 'es';

            // Fetch from backend API (note: /api prefix required for Firebase Functions)
            const apiUrl = `https://us-central1-linguana-8ebcc.cloudfunctions.net/api/swipe/words?targetLanguage=${targetLanguage}&count=50`;
            console.log('[SPEED_SWIPE] Fetching words from:', apiUrl);

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.cards && data.cards.length > 0) {
                console.log(`[SPEED_SWIPE] Loaded ${data.cards.length} cards from ${data.source}`);
                setCards(data.cards);
            } else {
                console.log('[SPEED_SWIPE] No cards from API, using fallback');
                setCards(getFallbackCards());
            }

            setLoading(false);
        } catch (error) {
            console.error('[SPEED_SWIPE] Failed to fetch words:', error);
            // Fallback to static data
            setCards(getFallbackCards());
            setLoading(false);
        }
    };

    // Fallback cards when API fails
    const getFallbackCards = () => {
        const fallbackWords = [
            { word: 'Hello', translation: 'Hola', isCorrect: true },
            { word: 'Cat', translation: 'Perro', isCorrect: false },
            { word: 'Water', translation: 'Agua', isCorrect: true },
            { word: 'House', translation: 'Coche', isCorrect: false },
            { word: 'Friend', translation: 'Amigo', isCorrect: true },
            { word: 'Book', translation: 'Libro', isCorrect: true },
            { word: 'Sun', translation: 'Luna', isCorrect: false },
            { word: 'Milk', translation: 'Leche', isCorrect: true },
            { word: 'Dog', translation: 'Gato', isCorrect: false },
            { word: 'Red', translation: 'Rojo', isCorrect: true }
        ];

        const cards = [];
        for (let i = 0; i < 50; i++) {
            const base = fallbackWords[i % fallbackWords.length];
            cards.push({ ...base, id: i });
        }
        return cards;
    };

    useEffect(() => {
        fetchWords();
        return () => clearInterval(timerRef.current);
    }, []);

    // Tutorial State
    const [showTutorial, setShowTutorial] = useState(false);
    const handAnim = useRef(new Animated.Value(0)).current;

    // Check Tutorial
    const checkTutorial = async () => {
        try {
            // Use UTC date for consistent global timing
            const todayUTC = new Date().toISOString().split('T')[0];
            const lastShown = await AsyncStorage.getItem('LAST_SWIPE_TUTORIAL_DATE');

            if (lastShown !== todayUTC) {
                setShowTutorial(true);
                startTutorialAnimation();
                await AsyncStorage.setItem('LAST_SWIPE_TUTORIAL_DATE', todayUTC);

                // Auto hide after 2.5 seconds
                setTimeout(() => {
                    setShowTutorial(false);
                }, 2500);
            }
        } catch (error) {
            console.log('Error checking tutorial:', error);
        }
    };

    const startTutorialAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(handAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(handAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    };

    // Start Game
    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setTimeLeft(60);
        setCurrentIndex(0);
        gameEnded.current = false;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const gameEnded = useRef(false);

    // End Game
    const endGame = () => {
        if (gameEnded.current) return;
        gameEnded.current = true;

        if (timerRef.current) clearInterval(timerRef.current);

        // Use scoreRef to get the actual current score (avoids stale closure issue)
        const finalScore = scoreRef.current;

        setGameState('summary');

        try {
            sfxService.playSuccessFinish();
        } catch (e) {
            console.log('Error playing sound:', e);
        }

        // Award XP - score is 10 per correct answer, so XP = score / 10
        const xpEarned = Math.floor(finalScore / 10);
        console.log('[SPEED_SWIPE] Game ended with score:', finalScore, 'XP to award:', xpEarned);

        if (xpEarned > 0 && earnXP) {
            console.log('[SPEED_SWIPE] Calling earnXP with:', xpEarned);
            earnXP(xpEarned)
                .then((success) => {
                    console.log('[SPEED_SWIPE] earnXP result:', success);
                })
                .catch((err) => {
                    console.error('[SPEED_SWIPE] earnXP error:', err);
                });
        } else {
            console.log('[SPEED_SWIPE] Not awarding XP - xpEarned:', xpEarned, 'earnXP exists:', !!earnXP);
        }

        // Award stars for league ranking
        if (finalScore > 0) {
            console.log('[SPEED_SWIPE] Awarding league stars for XP:', xpEarned);
            leagueService.earnStars(xpEarned, userProfile);
        }
    };

    // Interpolation
    const rotate = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD * 1.5, 0, SWIPE_THRESHOLD * 1.5],
        outputRange: ['-30deg', '0deg', '30deg'],
        extrapolate: 'clamp'
    });

    const rotateAndTranslate = {
        transform: [{
            rotate: rotate
        }, ...position.getTranslateTransform()]
    };

    const rightOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const leftOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const nextCardOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: [1, 0.5, 1],
        extrapolate: 'clamp'
    });

    const nextCardScaleInterp = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: [1, 0.9, 1],
        extrapolate: 'clamp'
    });

    const nextCardStyle = {
        transform: [{ scale: nextCardScaleInterp }],
        opacity: nextCardOpacity
    };

    // Stable swipe functions using useCallback
    const forceSwipe = useCallback((direction) => {
        const x = direction === 'right' ? width + 100 : -width - 100;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            // Get the current item BEFORE advancing
            const item = cards[currentIndex];
            if (!item) return;

            const isRight = direction === 'right';
            const isCorrect = item.isCorrect === isRight;

            if (isCorrect) {
                setScore(prev => {
                    const newScore = prev + 10;
                    scoreRef.current = newScore;
                    return newScore;
                });
                sfxService.playCorrect();
                Haptics.success();
            } else {
                sfxService.playWrong();
                Haptics.error();
                setTimeLeft(prev => Math.max(0, prev - 2));
            }

            // FIRST: Advance the card index
            setCurrentIndex(prev => prev + 1);

            // THEN: Reset position on next frame to prevent flash
            // This ensures the new card is rendered before we reset position
            requestAnimationFrame(() => {
                position.setValue({ x: 0, y: 0 });
            });
        });
    }, [position, cards, currentIndex]);

    const resetPosition = useCallback(() => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true
        }).start();
    }, [position]);

    // PanResponder - include forceSwipe and resetPosition in dependencies
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            // Only capture if there's meaningful horizontal movement
            return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: Animated.event(
            [null, { dx: position.x, dy: position.y }],
            { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > SWIPE_THRESHOLD) {
                forceSwipe('right');
            } else if (gestureState.dx < -SWIPE_THRESHOLD) {
                forceSwipe('left');
            } else {
                resetPosition();
            }
        }
    }), [position, forceSwipe, resetPosition]);

    const handleSwipe = (direction) => {
        forceSwipe(direction);
    };

    // Check for game over
    useEffect(() => {
        if (currentIndex >= cards.length && cards.length > 0) {
            endGame();
        }
    }, [currentIndex, cards]);

    // Render Intro
    if (gameState === 'intro') {
        return (
            <ImageBackground
                source={GAME_BACKGROUNDS.SWIPE}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                    <SafeAreaView style={styles.safeArea}>
                        {/* Header with close button */}
                        <View style={styles.introHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        'Leave Game?',
                                        'If you leave now, your earned game right will be lost. Are you sure you want to exit?',
                                        [
                                            { text: 'Stay', style: 'cancel' },
                                            { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
                                        ]
                                    );
                                }}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={28} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Main Content - Entire area is tappable */}
                        <TouchableOpacity
                            style={styles.introContent}
                            activeOpacity={0.9}
                            onPress={loading ? null : startGame}
                            disabled={loading}
                        >
                            {/* Icon */}
                            <View style={styles.iconGlow}>
                                <Icon name="flash" size={56} color="#FCD34D" />
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>SPEED SWIPE</Text>
                            <Text style={styles.subtitle}>60 Seconds. Go!</Text>

                            {/* Instructions */}
                            <View style={styles.instructionBox}>
                                <View style={styles.instructionRow}>
                                    <View style={[styles.instructionIconBg, { backgroundColor: 'rgba(74, 222, 128, 0.2)' }]}>
                                        <Icon name="checkmark-circle" size={24} color="#4ADE80" />
                                    </View>
                                    <Text style={styles.instructionText}>Swipe RIGHT if Correct</Text>
                                    <Icon name="arrow-forward" size={20} color="#4ADE80" />
                                </View>
                                <View style={styles.instructionDivider} />
                                <View style={styles.instructionRow}>
                                    <View style={[styles.instructionIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                        <Icon name="close-circle" size={24} color="#EF4444" />
                                    </View>
                                    <Text style={styles.instructionText}>Swipe LEFT if Wrong</Text>
                                    <Icon name="arrow-back" size={20} color="#EF4444" />
                                </View>
                            </View>

                            {/* Tap to Start Hint */}
                            <View style={styles.tapHintSection}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#FCD34D" />
                                ) : (
                                    <>
                                        <Icon name="hand-left-outline" size={20} color="rgba(255,255,255,0.4)" />
                                        <Text style={styles.tapHintText}>Tap anywhere to start</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        );
    }

    // Calculate card data first - safely access with bounds check
    const currentCard = currentIndex < cards.length ? cards[currentIndex] : null;
    const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

    // Render Summary
    // Show summary if gameState is 'summary' OR if we've run out of cards (fallback)
    // Check for no current card as well to prevent flash during transition
    const isGameOver = gameState === 'summary' || (cards.length > 0 && !currentCard);

    if (isGameOver) {
        const baseXP = Math.floor(score / 10);
        const displayXP = doubleXpClaimed ? baseXP * 2 : baseXP;

        const handleWatchDoubleXP = async () => {
            setAdLoading(true);
            try {
                const rewardedAdService = require('../services/rewardedAdService').default;
                const success = await rewardedAdService.showAd(
                    'DOUBLE_XP',
                    () => {
                        // Reward callback - double the XP
                        setDoubleXpClaimed(true);
                        if (earnXP) {
                            earnXP(baseXP); // Award the additional XP (already awarded baseXP)
                        }
                        Haptics.success();
                    },
                    () => { }, // onClose
                    () => {
                        Alert.alert('Ad Error', 'Could not load ad. Please try again.');
                    }
                );
                if (!success) {
                    rewardedAdService.loadAd('DOUBLE_XP');
                    Alert.alert('Loading', 'Ad is loading, please try again in a moment.');
                }
            } catch (error) {
                console.error('Double XP ad error:', error);
            } finally {
                setAdLoading(false);
            }
        };

        return (
            <ImageBackground
                source={GAME_BACKGROUNDS.SWIPE}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.summaryContent}>
                            <Text style={styles.summaryTitle}>Time's Up!</Text>
                            <Text style={styles.finalScore}>{score}</Text>
                            <Text style={styles.scoreLabel}>POINTS</Text>

                            <View style={[styles.rewardBox, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                                <Icon name="star" size={24} color="#FFD700" />
                                <Text style={[styles.rewardText, { color: '#FFD700' }]}>
                                    +{displayXP} XP {doubleXpClaimed ? '(x2!)' : 'Earned'}
                                </Text>
                            </View>

                            {/* Double XP Button */}
                            {!doubleXpClaimed && (
                                <TouchableOpacity
                                    style={[styles.doubleXpButton, adLoading && { opacity: 0.6 }]}
                                    onPress={handleWatchDoubleXP}
                                    disabled={adLoading}
                                >
                                    <Icon name="videocam" size={20} color="#FFF" />
                                    <Text style={styles.doubleXpButtonText}>
                                        {adLoading ? 'Loading...' : 'Watch Ad for x2 XP'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.playButton} onPress={() => navigation.goBack()}>
                                <Text style={styles.playButtonText}>CONTINUE</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        );
    }

    // Render Game (currentCard and nextCard already calculated above)
    return (
        <ImageBackground
            source={GAME_BACKGROUNDS.SWIPE}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.timerContainer}>
                            <Icon name="time" size={20} color={timeLeft < 10 ? '#EF4444' : '#FFF'} />
                            <Text style={[styles.timerText, timeLeft < 10 && styles.timerUrgent]}>{timeLeft}s</Text>
                        </View>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreText}>{score}</Text>
                        </View>
                    </View>

                    {/* Game Area */}
                    <View style={styles.gameArea}>
                        {/* Next Card (Background) */}
                        {nextCard && (
                            <Animated.View style={[styles.card, styles.nextCard, nextCardStyle]}>
                                <Text style={styles.word}>{nextCard.word}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.translation}>{nextCard.translation}</Text>
                            </Animated.View>
                        )}

                        {/* Current Card (Foreground) */}
                        {currentCard ? (
                            <Animated.View
                                {...panResponder.panHandlers}
                                style={[styles.card, rotateAndTranslate]}
                            >
                                <Text style={styles.word}>{currentCard.word}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.translation}>{currentCard.translation}</Text>

                                {/* Swipe Overlay Indicators */}
                                <Animated.View style={[styles.overlayIndicator, { backgroundColor: '#4ADE80', left: 20, opacity: rightOpacity }]}>
                                    <Icon name="checkmark-circle" size={50} color="#FFF" />
                                </Animated.View>
                                <Animated.View style={[styles.overlayIndicator, { backgroundColor: '#EF4444', right: 20, opacity: leftOpacity }]}>
                                    <Icon name="close-circle" size={50} color="#FFF" />
                                </Animated.View>
                            </Animated.View>
                        ) : (
                            <View style={styles.card}>
                                <ActivityIndicator size="large" color="#FFF" />
                            </View>
                        )}
                    </View>

                    {/* Controls Hint Removed */}

                </SafeAreaView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

    // Intro Screen Styles
    introHeader: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    introContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    iconGlow: {
        backgroundColor: 'rgba(252, 211, 77, 0.15)',
        padding: 20,
        borderRadius: 32,
        marginBottom: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#FCD34D',
        fontStyle: 'italic',
        fontWeight: '600',
        marginBottom: 24,
    },
    instructionBox: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    instructionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionText: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
    },
    instructionDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 2,
    },
    tapHintSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 32,
        gap: 8,
    },
    tapHintText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '500',
    },
    playButton: {
        flexDirection: 'row',
        backgroundColor: '#FCD34D',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FCD34D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        minWidth: '70%',
    },
    playButtonText: {
        color: '#1F2937',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1,
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 20, paddingHorizontal: 16 },
    timerText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
    timerUrgent: { color: '#EF4444' },
    scoreContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20, paddingHorizontal: 20 },
    scoreText: { color: '#FFF', fontSize: 24, fontWeight: '900' },

    gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { width: width * 0.85, height: height * 0.5, backgroundColor: '#FFF', borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, padding: 20 },
    nextCard: { zIndex: -1 },
    word: { fontSize: 40, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', width: '100%', paddingHorizontal: 10 },
    divider: { height: 2, width: '80%', backgroundColor: '#E5E7EB', marginVertical: 30 },
    translation: { fontSize: 32, color: '#4B5563', textAlign: 'center', width: '100%', paddingHorizontal: 10 },
    overlayIndicator: { position: 'absolute', top: 20, padding: 10, borderRadius: 50 },

    controlsHint: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: 40, width: '100%' },
    controlBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
    btnWrong: { backgroundColor: '#EF4444' },
    btnCorrect: { backgroundColor: '#4ADE80' },

    summaryContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    summaryTitle: { fontSize: 36, color: '#FFF', fontWeight: 'bold', marginBottom: 20 },
    finalScore: { fontSize: 80, color: '#FCD34D', fontWeight: '900' },
    scoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 40 },
    rewardBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: 15, borderRadius: 20, marginBottom: 40 },
    rewardText: { color: '#93C5FD', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    doubleXpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    doubleXpButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    secondaryButton: { marginTop: 20, padding: 15 },
    secondaryButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },

    tutorialOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    tutorialTextContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    tutorialText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 10,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }
});

export default SpeedSwipeScreen;
