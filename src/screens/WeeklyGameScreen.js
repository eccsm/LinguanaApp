/**
 * Weekly Word Puzzle Screen (Refactored)
 * Wordscapes-style game with letter wheel and word discovery
 * 
 * This is a complete refactoring using:
 * - Modular components (PuzzleGrid, LetterWheel, etc.)
 * - Custom hooks (usePuzzleGame)
 * - Clean data model (PuzzleModel)
 * - Service layer (weeklyGameService)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
// Note: react-native-orientation-locker removed - not properly linked
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';

// Contexts
import { useApp } from '../contexts/AppContext';
import { useAlert } from '../contexts/AlertContext';

// Hooks
import { usePuzzleGame } from '../hooks/usePuzzleGame';

// Components
import {
    PuzzleGrid,
    LetterWheel,
    WordPreview,
    GameHeader,
    GameStats,
    CompleteModal,
    LeaderboardModal,
} from '../components/puzzle';
import ExpeditionMap from '../components/ExpeditionMap';

// Services
import rewardedAdService from '../services/rewardedAdService';

// Utils
import Haptics from '../utils/haptics';


// ============================================================================
// Component
// ============================================================================

const WeeklyGameScreen = ({ navigation }) => {
    const { user, userProfile } = useApp();
    const { showAlert } = useAlert();
    const { height: screenHeight, width: screenWidth } = useWindowDimensions();

    // Note: Portrait mode lock is configured in AndroidManifest.xml for this activity
    // If you need runtime orientation locking, install and properly link react-native-orientation-locker

    // Calculate responsive grid height based on screen size
    // Smaller screens need proportionally less space for the grid to fit everything
    const gridMaxHeightFraction = useMemo(() => {
        if (screenHeight < 600) return 0.30; // Very small screens: compact grid
        if (screenHeight < 700) return 0.34; // Small screens
        if (screenHeight < 800) return 0.38; // Medium screens
        return 0.42; // Large screens
    }, [screenHeight]);

    // Check if this is a very small screen (for additional layout adjustments)
    const isVerySmallScreen = screenHeight < 600 || screenWidth < 360;

    // Preload puzzle ads when entering the screen
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'game'
    // Use UTC day for consistent global timing (1=Mon, 7=Sun)
    const getUTCWeekDay = () => {
        const day = new Date().getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        return day === 0 ? 7 : day; // Convert to 1=Mon, ..., 7=Sun
    };
    const [currentDay, setCurrentDay] = useState(getUTCWeekDay());

    // Track which day was selected from the map (for loading specific day's puzzle)
    const [selectedDay, setSelectedDay] = useState(currentDay);

    // Track days that were unlocked with gems (persisting in session)
    const [unlockedDays, setUnlockedDays] = useState([]);

    const [completedDays, setCompletedDays] = useState([]); // Track completed day IDs
    const [expeditionNodes, setExpeditionNodes] = useState(null); // Dynamic nodes from backend
    const [showLeaderboard, setShowLeaderboard] = useState(false); // Leaderboard modal

    // Use the puzzle game hook for all game logic - pass selectedDay to load correct puzzle
    const {
        gameState,
        puzzle,
        currentWord,
        selectedIndices,
        error,
        selectLetter,
        submitWord,
        useHint,
        useTip,
        refreshPuzzle,
        lastSubmitResult,
        clearLastSubmitResult,
        activeTip,
        clearActiveTip,
        highlightedWordCells,
    } = usePuzzleGame(user?.uid, showAlert, selectedDay);

    // Shuffle map: shuffleMap[displayIndex] = originalIndex
    const [shuffleMap, setShuffleMap] = useState(null);

    // Shuffle letters function - creates a mapping from display position to original position
    const handleShuffle = useCallback(() => {
        if (!puzzle?.letters) return;

        // Create array of indices [0, 1, 2, ...]
        const indices = puzzle.letters.map((_, i) => i);

        // Shuffle the indices
        const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);

        // shuffleMap[displayPosition] = originalIndex
        setShuffleMap(shuffledIndices);
    }, [puzzle?.letters]);

    // Reset shuffle map when puzzle changes
    useEffect(() => {
        if (puzzle?.letters) {
            // Initially, display order = original order (identity mapping)
            setShuffleMap(puzzle.letters.map((_, i) => i));
        }
    }, [puzzle?.letters]);

    // Show tip Alert when activeTip changes
    useEffect(() => {
        if (activeTip) {
            // wordLanguage is already the full name like "Portuguese" or "Turkish"
            const wordLang = activeTip.wordLanguage || 'Unknown';
            showAlert(
                'Translation Tip',
                `In ${wordLang} means: "${activeTip.meaning}" (${activeTip.wordLength} letters)`,
                [{ text: 'Got it!', onPress: clearActiveTip }]
            );
        }
    }, [activeTip, clearActiveTip, showAlert]);

    // Get displayed letters based on shuffle map
    const displayedLetters = useMemo(() => {
        if (!puzzle?.letters || !shuffleMap) return puzzle?.letters || [];
        return shuffleMap.map(originalIndex => puzzle.letters[originalIndex]);
    }, [puzzle?.letters, shuffleMap]);

    // Map display index to original index for selection
    const handleSelectLetter = useCallback((displayIndex) => {
        if (!shuffleMap) {
            selectLetter(displayIndex);
            return;
        }
        const originalIndex = shuffleMap[displayIndex];
        selectLetter(originalIndex);
    }, [shuffleMap, selectLetter]);

    // ============================================================================
    // Handlers
    // ============================================================================

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleOpenLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
    }, []);

    const handleCloseLeaderboard = useCallback(() => {
        setShowLeaderboard(false);
    }, []);

    const handleHint = useCallback(() => {
        useHint(userProfile?.xp || 0);
    }, [useHint, userProfile?.xp]);

    const handleTip = useCallback(() => {
        useTip(userProfile?.xp || 0);
    }, [useTip, userProfile?.xp]);

    // Load expedition map from backend on mount (includes nodes, currentDay, completedDays)
    useEffect(() => {
        const loadExpeditionMap = async () => {
            if (!user?.uid) return;
            try {
                const response = await fetch(
                    `${BACKEND_URL}/api/expedition/map?userId=${user.uid}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-client-secret': APP_CLIENT_SECRET,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    // Use server's current day (based on UTC)
                    if (data.currentDayUTC) {
                        setCurrentDay(data.currentDayUTC);
                    }
                    // Set completed days from backend
                    if (data.completedDays) {
                        setCompletedDays(data.completedDays);
                    }
                    // Set unlocked days from backend
                    if (data.unlockedDays) {
                        setUnlockedDays(data.unlockedDays);
                    } else {
                        // Backend doesn't return unlockedDays yet, fetch from Firestore
                        const userDoc = await firestore().collection('users').doc(user.uid).get();
                        if (userDoc.exists && userDoc.data().weeklyUnlockedDays) {
                            setUnlockedDays(userDoc.data().weeklyUnlockedDays);
                        }
                    }
                    // Set dynamic nodes from backend (for future events)
                    if (data.nodes) {
                        setExpeditionNodes(data.nodes);
                    }
                } else {
                    console.error('Failed to load expedition map:', response.status);
                    // Fallback: load from Firestore directly (with week ID check)
                    await loadFromFirestoreWithWeekCheck();
                }
            } catch (error) {
                console.error('Error loading expedition map:', error);
                // Fallback: load from Firestore directly (with week ID check)
                await loadFromFirestoreWithWeekCheck();
            }
        };

        // Helper to load from Firestore with week ID validation
        const loadFromFirestoreWithWeekCheck = async () => {
            if (!user?.uid) return;
            try {
                const userDoc = await firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();

                    // Calculate current week ID
                    const now = new Date();
                    const dayOfWeek = now.getUTCDay();
                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const monday = new Date(now);
                    monday.setUTCDate(now.getUTCDate() - daysToMonday);
                    monday.setUTCHours(0, 0, 0, 0);
                    const currentWeekId = monday.toISOString().split('T')[0];

                    const storedWeekId = userData.weeklyCompletedWeekId;

                    // Only use data if it's from current week
                    if (storedWeekId === currentWeekId) {
                        if (userData.weeklyCompletedDays) {
                            setCompletedDays(userData.weeklyCompletedDays);
                        }
                        if (userData.weeklyUnlockedDays) {
                            setUnlockedDays(userData.weeklyUnlockedDays);
                        }
                    } else {
                        // Stale data from old week - clear it
                        console.log('[WeeklyGame] Clearing stale week data');
                        setCompletedDays([]);
                        setUnlockedDays([]);
                    }
                }
            } catch (fallbackError) {
                console.error('Firestore fallback failed:', fallbackError);
            }
        };
        loadExpeditionMap();
    }, [user?.uid]);

    const handleComplete = useCallback(async () => {
        // Mark the selected day (the puzzle we just finished) as completed locally
        setCompletedDays(prev => {
            if (!prev.includes(selectedDay)) {
                return [...prev, selectedDay];
            }
            return prev;
        });

        // Persist to Firestore with current weekId for proper reset tracking
        if (user?.uid) {
            try {
                // Calculate current week ID (Monday's date) to track which week this belongs to
                const now = new Date();
                const dayOfWeek = now.getUTCDay();
                const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(now);
                monday.setUTCDate(now.getUTCDate() - daysToMonday);
                monday.setUTCHours(0, 0, 0, 0);
                const weekId = monday.toISOString().split('T')[0]; // e.g., "2024-12-23"

                await firestore().collection('users').doc(user.uid).set({
                    weeklyCompletedDays: firestore.FieldValue.arrayUnion(selectedDay),
                    weeklyCompletedWeekId: weekId, // Track which week this data belongs to
                }, { merge: true });
            } catch (error) {
                console.error('Error saving completed day:', error);
            }
        }

        // Go back to map
        setViewMode('map');
    }, [selectedDay, user?.uid]);

    const handleViewLeaderboardFromComplete = useCallback(() => {
        navigation.navigate('Leaderboards', { initialTab: 'weekly' });
    }, [navigation]);

    const handleNodePress = useCallback((dayId) => {
        const isNodeCompleted = completedDays?.includes(dayId);
        const isAlreadyUnlocked = unlockedDays?.includes(dayId);
        const isSkippedDay = dayId < currentDay && !isNodeCompleted && !isAlreadyUnlocked;
        const UNLOCK_COST = 100; // Cost in gems to unlock skipped days

        // If it's a skipped day (past, not completed, not unlocked), offer to unlock
        if (isSkippedDay) {
            const userGems = userProfile?.gems || 0;
            const timeWarpKeys = userProfile?.inventory?.timeWarpKey || 0;

            // Helper function to unlock the day
            const unlockDay = async (useKey = false) => {
                if (!user?.uid) return;

                try {
                    // Calculate current week ID for proper reset tracking
                    const now = new Date();
                    const dayOfWeek = now.getUTCDay();
                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const monday = new Date(now);
                    monday.setUTCDate(now.getUTCDate() - daysToMonday);
                    monday.setUTCHours(0, 0, 0, 0);
                    const weekId = monday.toISOString().split('T')[0];

                    const updateData = {
                        weeklyUnlockedDays: firestore.FieldValue.arrayUnion(dayId),
                        weeklyCompletedWeekId: weekId, // Track which week this belongs to
                    };

                    if (useKey) {
                        // Use Time Warp Key from inventory
                        updateData['inventory.timeWarpKey'] = firestore.FieldValue.increment(-1);
                    } else {
                        // Deduct gems
                        updateData.gems = firestore.FieldValue.increment(-UNLOCK_COST);
                    }

                    await firestore().collection('users').doc(user.uid).update(updateData);

                    // Success feedback
                    Haptics.success();

                    // Mark this day as unlocked locally
                    setUnlockedDays(prev => [...prev, dayId]);

                    // Set the selected day for loading the correct puzzle
                    setSelectedDay(dayId);

                    // Start the game
                    setViewMode('game');
                } catch (error) {
                    console.error('Error unlocking day:', error);
                    Haptics.error();
                    showAlert('Error', 'Failed to unlock day. Please try again.', [{ text: 'OK' }], { type: 'error' });
                }
            };

            // Build buttons based on what's available
            const buttons = [{ text: 'Cancel', style: 'cancel' }];

            if (timeWarpKeys > 0) {
                // Has Time Warp Key - offer to use it
                buttons.push({
                    text: `Use Time Warp Key (${timeWarpKeys})`,
                    onPress: () => unlockDay(true),
                });
            }

            if (userGems >= UNLOCK_COST) {
                // Has enough gems - offer to pay
                buttons.push({
                    text: `Pay 💎 ${UNLOCK_COST}`,
                    onPress: () => unlockDay(false),
                });
            }

            // If user has neither keys nor enough gems
            if (timeWarpKeys === 0 && userGems < UNLOCK_COST) {
                showAlert(
                    'Unlock Skipped Day',
                    `You need a Time Warp Key or 💎 ${UNLOCK_COST} gems to unlock this day.\n\nYou have: 💎 ${userGems} gems\n🔑 ${timeWarpKeys} Time Warp Keys\n\nVisit the Shop to get more!`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Go to Shop',
                            onPress: () => navigation.navigate('Shop')
                        },
                    ],
                    { type: 'warning' }
                );
                return;
            }

            // Show the unlock options
            let message = 'This day was skipped. How would you like to unlock it?';
            if (timeWarpKeys > 0 && userGems >= UNLOCK_COST) {
                message += `\n\n🔑 ${timeWarpKeys} Time Warp Keys available\n💎 ${userGems} gems available`;
            } else if (timeWarpKeys > 0) {
                message += `\n\n🔑 ${timeWarpKeys} Time Warp Keys available`;
            } else {
                message += `\n\n💎 ${userGems} gems available`;
            }

            showAlert('Unlock Skipped Day', message, buttons, { type: 'question' });
            return;
        }

        // If already completed, show info message
        if (isNodeCompleted) {
            showAlert(
                'Already Completed',
                'You\'ve already finished this day\'s puzzle! Great job! 🎉',
                [{ text: 'OK' }],
                { type: 'success' }
            );
            return;
        }

        // Current day or already unlocked - set selected day and launch the game
        setSelectedDay(dayId);
        setViewMode('game');
    }, [currentDay, completedDays, unlockedDays, userProfile?.gems, userProfile?.inventory, user?.uid, showAlert, navigation]);

    const handleBackToMap = useCallback(() => {
        setViewMode('map');
    }, []);

    // ============================================================================
    // Loading State
    // ============================================================================

    if (gameState === 'loading' && viewMode === 'game') {
        return (
            <ImageBackground
                source={require('../../assets/backgrounds/puzzle_background.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.centered}>
                        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Loading puzzle...</Text>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        );
    }

    // ============================================================================
    // Error State
    // ============================================================================

    if ((gameState === 'error' || !puzzle) && viewMode === 'game') {
        return (
            <ImageBackground
                source={require('../../assets/backgrounds/puzzle_background.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.centered}>
                        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                        <Icon name="alert-circle" size={64} color="#fff" />
                        <Text style={styles.errorText}>{error || 'Failed to load puzzle'}</Text>
                        <TouchableOpacity onPress={refreshPuzzle} style={styles.retryButton}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBackToMap} style={styles.backButton}>
                            <Text style={styles.backButtonText}>Back to Map</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        );
    }

    // ============================================================================
    // Main Game UI
    // ============================================================================

    if (viewMode === 'map') {
        return (
            <ImageBackground
                source={require('../../assets/backgrounds/puzzle_background.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.safeArea}>
                        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Icon name="arrow-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Weekly Expedition</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <ExpeditionMap
                            currentDay={currentDay === 0 ? 7 : currentDay}
                            onNodePress={handleNodePress}
                            completedDays={completedDays}
                            unlockedDays={unlockedDays}
                            nodes={expeditionNodes}
                            isCompleted={false} // Todo: fetch from backend
                        />
                    </SafeAreaView>
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require('../../assets/backgrounds/puzzle_background.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <SafeAreaView style={[styles.safeArea, isVerySmallScreen && styles.compactSafeArea]}>
                    <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                    {/* Header */}
                    <GameHeader
                        title="Weekly Puzzle"
                        onBack={handleBackToMap}
                        onLeaderboard={handleOpenLeaderboard}
                        compact={isVerySmallScreen}
                    />

                    {/* Stats Bar */}
                    <GameStats
                        score={puzzle?.score || 0}
                        foundCount={puzzle?.foundWords?.length || 0}
                        totalCount={puzzle?.words?.length || 0}
                        onHint={handleHint}
                        hintEnabled={gameState === 'playing'}
                        onTip={handleTip}
                        tipEnabled={gameState === 'playing'}
                        compact={isVerySmallScreen}
                    />

                    {/* Crossword Grid */}
                    {puzzle && (
                        <PuzzleGrid
                            grid={puzzle.grid}
                            gridSize={puzzle.gridSize}
                            maxHeightFraction={gridMaxHeightFraction}
                            highlightedCells={highlightedWordCells}
                        />
                    )}

                    {/* Current Word Preview */}
                    <WordPreview
                        word={currentWord}
                        lastResult={lastSubmitResult}
                        onAnimationComplete={clearLastSubmitResult}
                        compact={isVerySmallScreen}
                    />

                    {/* Letter Wheel */}
                    <LetterWheel
                        letters={displayedLetters}
                        selectedIndices={selectedIndices.map(origIdx => shuffleMap ? shuffleMap.indexOf(origIdx) : origIdx).filter(i => i !== -1)}
                        onSelectLetter={handleSelectLetter}
                        onSubmit={submitWord}
                        onShuffle={handleShuffle}
                        enabled={gameState === 'playing'}
                        compact={isVerySmallScreen}
                    />

                    {/* Leaderboard Modal */}
                    <LeaderboardModal
                        visible={showLeaderboard}
                        userId={user?.uid}
                        onClose={handleCloseLeaderboard}
                    />

                    {/* Complete Modal */}
                    <CompleteModal
                        visible={gameState === 'complete'}
                        score={puzzle?.score || 0}
                        wordsFound={puzzle?.foundWords?.length || 0}
                        totalWords={puzzle?.words?.length || 0}
                        onClose={handleComplete}
                        onViewLeaderboard={handleViewLeaderboardFromComplete}
                    />
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    compactSafeArea: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) - 5 : 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    errorText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 32,
    },
    retryButton: {
        marginTop: 24,
        backgroundColor: '#fff',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 25,
    },
    retryText: {
        color: '#4A90D9',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        marginTop: 12,
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    backButtonText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

export default WeeklyGameScreen;
