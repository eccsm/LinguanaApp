/**
 * Enhanced Daily Challenge Screen
 * - Backend integration for dynamic challenges
 * - Lives/Hearts system (3 lives)
 * - Multiple game types (translation, fill-blank, etc.)
 * - Global leaderboard
 * - Streak tracking
 * - Beautiful animations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { BACKEND_URL, APP_CLIENT_SECRET } from '@env';
import AdContinueModal from '../components/AdContinueModal';
import rewardedAdService from '../services/rewardedAdService';
import Logger from '../utils/logger';
import { ConfettiCelebration, ParticleBurst, FloatingHearts } from '../components/CelebrationEffects';
import { AnimatedButton, ShakeView } from '../components/AnimatedComponents';
import Haptics from '../utils/haptics';
import sfxService from '../services/sfxService';
import weeklyGameService from '../services/weeklyGameService';
import shopItemService from '../services/shopItemService';
import ComboMeter from '../components/ComboMeter';
import { GAME_BACKGROUNDS } from '../constants/backgrounds';

// Create dedicated logger for daily game
const GameLogger = Logger.withCategory('DAILY_GAME');

const { height } = Dimensions.get('window');

// Avatar images for leaderboard display
const AVATAR_IMAGES = {
  'avatar_gecko': require('../../assets/avatars/gecko.png'),
  'avatar_chameleon': require('../../assets/avatars/chameleon.png'),
  'avatar_dragon': require('../../assets/avatars/dragon-b.png'),
  'avatar_axolotl': require('../../assets/avatars/axolotil.png'),
  'avatar_mascott': require('../../assets/avatars/mascott.png'),
  'avatar_speedy': require('../../assets/avatars/speedy_lizard.png'),
};

const GameStartModal = ({ visible, onStart, colors, isDarkMode, challengeTitle }) => {
  if (!visible) return null;

  return (
    <View style={styles.startModalOverlay}>
      <LinearGradient
        colors={isDarkMode ? ['#A78BFA', '#7C3AED'] : ['#8B5CF6', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.startModalGradient}
      >
        <View style={[styles.startModalContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.startModalHeader}>
            <Icon name="rocket" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.startModalTitle, { color: colors.text }]}>Daily Challenge Ready!</Text>
          <Text style={[styles.startModalSubtitle, { color: colors.textSecondary }]}>
            You have 3 lives. Good luck!
          </Text>

          <TouchableOpacity onPress={onStart} activeOpacity={0.8}>
            <LinearGradient
              colors={isDarkMode ? ['#8B5CF6', '#7C3AED'] : ['#6D28D9', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start Challenge</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const DailyGameScreen = ({ navigation, route }) => {
  const { user, userProfile } = useApp();
  const { colors, isDarkMode, activeTheme } = useTheme();

  // Game State
  const [gameState, setGameState] = useState('loading'); // loading, start, playing, complete, failed, alreadyCompleted
  const [challenge, setChallenge] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [combo, setCombo] = useState(0); // Combo streak
  const [maxCombo, setMaxCombo] = useState(0); // Track max combo for analytics
  const [startTime, setStartTime] = useState(null);
  const [usedAdContinue, setUsedAdContinue] = useState(false);
  const [showAdContinueModal, setShowAdContinueModal] = useState(false);

  // Heart Refill state
  const [usedHeartRefill, setUsedHeartRefill] = useState(false);
  const [heartRefillCount, setHeartRefillCount] = useState(0);

  // **CRITICAL**: Refs to track actual current values (prevent React closure issues)
  const gameEndedRef = useRef(false);
  const livesRef = useRef(3); // Track actual lives synchronously
  const answersRef = useRef([]); // Track actual answers synchronously (for score calculation)
  const saveTimeoutRef = useRef(null); // Debounce timer for auto-save

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [streak, setStreak] = useState(0);
  const [leaderboardTab, setLeaderboardTab] = useState('daily'); // 'daily' or 'weekly'
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const popupAnim = useRef(new Animated.Value(0)).current;
  const [popupScore, setPopupScore] = useState(null);

  // Celebration Effects
  const [showConfetti, setShowConfetti] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [heartsTrigger, setHeartsTrigger] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Resume Overlay
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const resumeOverlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if we should show leaderboard directly (user already completed today)
    const showLeaderboardOnly = route?.params?.showLeaderboardOnly;

    if (showLeaderboardOnly) {
      // Show dedicated full-screen leaderboard view
      setGameState('leaderboardOnly');
      fetchLeaderboard();
    } else {
      // Normal flow: fetch challenge
      fetchChallenge();
    }

    // Preload rewarded ad so it's ready when user needs it
    rewardedAdService.preloadAd();

    // Load heart refill inventory count
    const loadHeartRefillCount = async () => {
      if (user?.uid) {
        const inventory = await shopItemService.getInventory(user.uid);
        setHeartRefillCount(inventory.heartRefill || 0);
      }
    };
    loadHeartRefillCount();
  }, []);

  // **Refactored Save Logic**
  const saveProgress = (immediate = false) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't save if game has ended
    if (gameEndedRef.current) {
      return;
    }

    // **CRITICAL FIX**: Use answersRef.current instead of answers state (which may be stale)
    const currentAnswers = answersRef.current;

    if (gameState === 'playing' && challenge && currentAnswers.length > 0) {
      const completionTime = Math.floor((Date.now() - startTime) / 1000);
      const correctAnswers = currentAnswers.filter(a => a.isCorrect).length;
      const wrongAnswers = currentAnswers.filter(a => !a.isCorrect).length;

      // **CRITICAL FIX**: Calculate score from answersRef to avoid stale state closures
      const calculatedScore = currentAnswers.reduce((total, answer) => {
        if (answer.isCorrect) {
          const question = challenge?.questions?.find(q => q.id === answer.questionId);
          // Recalculate combo bonus based on answer sequence
          // Note: This is an approximation since we don't store historical combo per answer in this simple ref
          // For perfect accuracy we'd need to store points earned per answer in the answer object
          return total + (answer.pointsEarned || question?.points || 10);
        }
        return total;
      }, 0);

      // Use livesRef.current (actual value) instead of lives (stale closure)
      const actualLives = livesRef.current;
      const isInProgress = currentAnswers.length < challenge.totalQuestions && actualLives > 0;

      if (isInProgress) {
        const doSave = () => {
          GameLogger.info(`Saving progress (${immediate ? 'IMMEDIATE' : 'DEBOUNCED'})`, { lives: actualLives, questions: currentAnswers.length });

          const savedProgress = {
            challenge,
            currentQuestion,
            lives: actualLives,
            score: calculatedScore,
            answers: currentAnswers,
            usedAdContinue,
            elapsedTime: completionTime * 1000,
          };

          // Save to backend asynchronously (fire and forget)
          fetch(`${BACKEND_URL}/api/daily/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-client-secret': APP_CLIENT_SECRET
            },
            body: JSON.stringify({
              userId: user.uid,
              displayName: userProfile?.displayName || 'Anonymous',
              score: calculatedScore,
              maxScore: challenge.maxScore,
              completionTime,
              correctAnswers,
              wrongAnswers,
              usedAdContinue,
              completed: false,
              savedProgress,
            }),
            // keepalive: true // Optional: helps request survive unmount
          }).catch(err => {
            GameLogger.error('Failed to save progress:', err);
          });
        };

        if (immediate) {
          doSave();
        } else {
          saveTimeoutRef.current = setTimeout(doSave, 1000);
        }
      } else if (actualLives <= 0 && !gameEndedRef.current) {
        // User exited with 0 lives but game didn't "end" officially yet
        // Force "Game Over" save to clear progress
        GameLogger.info('User exited with 0 lives - forcing Game Over save to clear progress');

        fetch(`${BACKEND_URL}/api/daily/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET
          },
          body: JSON.stringify({
            userId: user.uid,
            displayName: userProfile?.displayName || 'Anonymous',
            score: calculatedScore,
            maxScore: challenge.maxScore,
            completionTime,
            correctAnswers,
            wrongAnswers,
            usedAdContinue,
            completed: false,
            savedProgress: null, // Explicitly clear progress
          }),
        }).catch(err => GameLogger.error('Failed to force clear progress:', err));
      }
    }
  };

  // **AUTO-SAVE**: Trigger save on state changes
  useEffect(() => {
    saveProgress(false); // Debounced save

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState, challenge, currentQuestion, lives, score, answers, usedAdContinue, startTime, user.uid, userProfile]);

  // **EXIT LISTENER**: Force save when user leaves screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameState === 'playing' && !gameEndedRef.current) {
        // Force immediate save before leaving
        saveProgress(true);
      }
    });

    return unsubscribe;
  }, [navigation, gameState, challenge, currentQuestion, lives, score, answers, usedAdContinue, startTime, user.uid, userProfile]);

  // Use cached challenge data (instant loading)
  const useCachedChallenge = (data) => {
    try {
      if (data.success) {
        // Check if user has saved progress
        if (data.hasProgress && data.savedProgress) {
          GameLogger.info('Resuming saved progress');

          // Restore challenge
          setChallenge(data.savedProgress.challenge);

          // **CRITICAL FIX**: Use answers.length as current question index
          // This is more reliable than currentQuestion due to React state closures
          const resumeQuestionIndex = data.savedProgress.answers?.length || data.savedProgress.currentQuestion;

          // Restore game state
          setCurrentQuestion(resumeQuestionIndex);
          setLives(data.savedProgress.lives);
          livesRef.current = data.savedProgress.lives;
          setScore(data.savedProgress.score);
          setAnswers(data.savedProgress.answers);
          answersRef.current = data.savedProgress.answers || []; // **CRITICAL**: Sync ref too
          setUsedAdContinue(data.savedProgress.usedAdContinue);
          setStartTime(Date.now() - (data.savedProgress.elapsedTime || 0));

          // Go directly to playing state
          setGameState('playing');
          fadeIn();

          // Show brief alert (with null checks for challenge data)
          const totalQ = data.savedProgress.challenge?.totalQuestions || data.savedProgress.challenge?.questions?.length || '?';
          setTimeout(() => {
            Alert.alert(
              '🔄 Resuming...',
              `Question ${resumeQuestionIndex + 1}/${totalQ} • ${data.savedProgress.lives}❤️ • ${data.savedProgress.score} pts`,
              [{ text: 'Let\'s Go!', style: 'default' }],
              { cancelable: false }
            );
          }, 300);
        } else {
          // New challenge - instant start screen
          setChallenge(data.challenge);
          setGameState('start');
        }
      } else if (data.alreadyCompleted) {
        setGameState('alreadyCompleted');
      }
    } catch (error) {
      GameLogger.error('Cache parse error:', error);
      fetchChallenge();
    }
  };

  // Fetch today's challenge from backend
  const fetchChallenge = async () => {
    try {
      setGameState('loading');

      const preferredLang = userProfile?.nativeLanguage;
      const nativeLanguage = (typeof preferredLang === 'object' ? preferredLang?.code : preferredLang) || 'en';

      const url = `${BACKEND_URL}/api/daily/challenge?nativeLanguage=${nativeLanguage}&userId=${user?.uid || 'guest'}`;
      GameLogger.info(`[FETCH] Requesting URL: ${url}`);

      const response = await fetch(
        url,
        {
          headers: {
            'x-client-secret': APP_CLIENT_SECRET
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        GameLogger.error(`Fetch failed: ${response.status}`);
        throw new Error(`Failed to fetch challenge: ${response.status}`);
      }

      const data = await response.json();

      // Check for already completed flag (now returned with 200 OK)
      if (data.alreadyCompleted) {
        GameLogger.info('User already completed challenge');
        setGameState('alreadyCompleted');
        return;
      }

      // Debug: Log what backend returned
      GameLogger.info('Backend response:', {
        success: data.success,
        hasProgress: data.hasProgress,
        alreadyCompleted: data.alreadyCompleted,
        hasSavedProgress: !!data.savedProgress,
        answersCount: data.savedProgress?.answers?.length,
      });

      if (data.success) {
        // Check if user has saved progress
        if (data.hasProgress && data.savedProgress) {
          GameLogger.info('Resuming saved progress from fetch');

          // Restore challenge
          setChallenge(data.savedProgress.challenge);

          // **CRITICAL FIX**: Use answers.length as current question index
          const resumeQuestionIndex = data.savedProgress.answers?.length || data.savedProgress.currentQuestion;

          // Restore game state
          setCurrentQuestion(resumeQuestionIndex);
          setLives(data.savedProgress.lives);
          livesRef.current = data.savedProgress.lives;
          setScore(data.savedProgress.score);
          setAnswers(data.savedProgress.answers);
          answersRef.current = data.savedProgress.answers || []; // **CRITICAL**: Sync ref with restored answers
          setUsedAdContinue(data.savedProgress.usedAdContinue);
          setStartTime(Date.now() - (data.savedProgress.elapsedTime || 0));

          setGameState('playing');
          fadeIn();

          // Show polished resume overlay
          setResumeInfo({
            currentQuestion: resumeQuestionIndex + 1,
            totalQuestions: data.savedProgress.challenge.totalQuestions,
            lives: data.savedProgress.lives,
            score: data.savedProgress.score,
          });
          setShowResumeOverlay(true);

          // Animate overlay in
          Animated.spring(resumeOverlayAnim, {
            toValue: 1,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }).start();

          // Auto-dismiss after 2.5 seconds
          setTimeout(() => {
            Animated.timing(resumeOverlayAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShowResumeOverlay(false);
            });
          }, 2500);
        } else {
          // New challenge
          setChallenge(data.challenge);
          setGameState('start');
        }
      } else if (data.alreadyCompleted) {
        setGameState('alreadyCompleted');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      GameLogger.error('Fetch challenge error:', error);

      setGameState('start');

      if (error.message && error.message.includes('403')) {
        setGameState('alreadyCompleted');
      } else {
        Alert.alert(
          'Connection Error',
          `Failed to load challenge: ${error.message}\n\nPlease check your internet connection and try again.`,
          [
            { text: 'Retry', onPress: fetchChallenge },
            { text: 'Go Back', onPress: () => navigation.goBack(), style: 'cancel' }
          ]
        );
      }
    }
  };

  // Start the challenge
  const startChallenge = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setCurrentQuestion(0);
    setLives(3);
    livesRef.current = 3; // Reset ref too
    syncLivesToFirebase(3); // Sync initial lives to Firebase
    setScore(0);
    setAnswers([]);
    setCombo(0);
    setMaxCombo(0);
    answersRef.current = []; // **CRITICAL**: Reset ref too
    gameEndedRef.current = false; // Reset game ended flag
  };

  // Sync lives to Firebase so Shop and other screens can read it
  const syncLivesToFirebase = async (newLives) => {
    if (!user?.uid) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({ lives: newLives });
      GameLogger.info('Lives synced to Firebase:', newLives);
    } catch (error) {
      GameLogger.error('Failed to sync lives:', error);
    }
  };

  // Fetch leaderboard from backend
  const fetchLeaderboard = async () => {
    try {
      Logger.log('[LEADERBOARD] 📊 Fetching global leaderboard...');

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BACKEND_URL}/api/daily/leaderboard?date=${today}&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-secret': APP_CLIENT_SECRET
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        let leaderboardData = data.leaderboard;

        // Frontend fallback: Fetch missing usernames directly from Firestore
        // This handles cases where backend hasn't been updated/redeployed yet
        // OPTIMIZATION: Backend now handles this, removed redundant client-side fetch.
        // const entriesMissingUsername = leaderboardData.filter(e => !e.username && e.userId);
        // if (entriesMissingUsername.length > 0) { ... }

        Logger.log(`[LEADERBOARD] ✅ Loaded ${leaderboardData.length} entries`);
        setLeaderboard(leaderboardData);

        // Find user's rank
        const userEntry = data.leaderboard.find(entry => entry.userId === user.uid);
        if (userEntry) {
          setUserRank(userEntry.rank);
          Logger.log(`[LEADERBOARD] User rank: #${userEntry.rank}`);
        } else {
          Logger.log('[LEADERBOARD] User not found in leaderboard');
        }
      } else {
        Logger.error('[LEADERBOARD] Failed to load:', data.error);
        setLeaderboard([]);
      }
    } catch (error) {
      Logger.error('[LEADERBOARD] Fetch error:', error);
      setLeaderboard([]);
    }
  };

  // Fetch weekly puzzle leaderboard
  const fetchWeeklyLeaderboard = async () => {
    try {
      Logger.log('[LEADERBOARD] 📊 Fetching weekly leaderboard...');
      const data = await weeklyGameService.getLeaderboard('weekly');

      if (data.success) {
        Logger.log(`[LEADERBOARD] ✅ Loaded ${data.leaderboard.length} weekly entries`);
        setWeeklyLeaderboard(data.leaderboard);
      } else {
        Logger.error('[LEADERBOARD] Weekly failed:', data.error);
        setWeeklyLeaderboard([]);
      }
    } catch (error) {
      Logger.error('[LEADERBOARD] Weekly fetch error:', error);
      setWeeklyLeaderboard([]);
    }
  };

  // Handle answer selection
  const handleAnswer = (selectedAnswer) => {
    // **CRITICAL FIX**: Use livesRef.current to avoid stale closure (lives state may be outdated after Heart Refill)
    if (showAdContinueModal || livesRef.current <= 0) {
      Logger.log(`[ANSWER] BLOCKED - Modal: ${showAdContinueModal}, Lives ref: ${livesRef.current}`);
      return;
    }

    const question = challenge.questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;

    Logger.log(`[ANSWER] Question ${currentQuestion + 1}: ${isCorrect ? 'Correct' : 'Wrong'}, Lives: ${lives}`);

    // Calculate points immediately if correct
    let pointsEarned = 0;
    let newCombo = combo;

    if (isCorrect) {
      // Update combo calculation first
      newCombo = combo + 1;

      // Calculate score with multiplier
      // Base multiplier: 1.0 + (combo * 0.1)
      const multiplier = 1 + (newCombo * 0.1);
      const basePoints = question.points || 10;
      pointsEarned = Math.round(basePoints * multiplier);
    } else {
      newCombo = 0;
    }

    // Create the new answer object WITH pointsEarned
    const newAnswer = {
      questionId: question.id,
      isCorrect,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      pointsEarned: pointsEarned, // Store immediately
    };

    // **CRITICAL FIX**: Update ref synchronously BEFORE setState (to avoid stale closures)
    answersRef.current = [...answersRef.current, newAnswer];
    Logger.log(`[ANSWER] answersRef updated: ${answersRef.current.length} answers, Points: ${pointsEarned}`);

    // Update state (async)
    setAnswers(prev => [...prev, newAnswer]);

    if (isCorrect) {
      // Correct answer
      Haptics.success(); // Success haptic feedback

      // Update combo state
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      setScore(prev => prev + pointsEarned);
      setParticleTrigger(prev => prev + 1); // Trigger particle burst
      playCorrectAnimation(pointsEarned);

      // Extra celebration for perfect streak (3+ correct in a row)
      const recentAnswers = answers.slice(-2);
      if (recentAnswers.length >= 2 && recentAnswers.every(a => a.isCorrect)) {
        setHeartsTrigger(prev => prev + 1); // Trigger floating hearts
        Haptics.heavy(); // Extra haptic for streak
      }

      // Milestone Haptics
      if (newCombo === 5 || newCombo === 10 || newCombo === 15) {
        Haptics.heavy();
      }

      setTimeout(() => {
        nextQuestion();
      }, 1200);
    } else {
      // Wrong answer - Show visual feedback first
      Haptics.error(); // Error haptic feedback
      setShakeTrigger(prev => prev + 1); // Trigger shake animation
      playWrongAnimation();

      // Reset combo state
      setCombo(0);

      // Update lives and show feedback
      setLives(prevLives => {
        // **CRITICAL FIX**: Don't allow negative lives
        const newLives = Math.max(0, prevLives - 1);
        livesRef.current = newLives; // Update ref synchronously
        Logger.log(`[LIVES] ${prevLives} → ${newLives} (ref updated)`);

        // Sync lives to Firebase
        syncLivesToFirebase(newLives);

        // Check lives after update
        if (newLives === 0) {
          Logger.log('[GAME] Out of lives!');

          // Check if user can use ad continue OR has Heart Refill available
          const canUseAd = !usedAdContinue;
          const canUseHeartRefill = !usedHeartRefill && heartRefillCount > 0;

          if (canUseAd || canUseHeartRefill) {
            Logger.log(`[AD-CONTINUE] Showing modal - canUseAd: ${canUseAd}, canUseHeartRefill: ${canUseHeartRefill}`);
            // Play last chance sound
            sfxService.playLastChance();

            setTimeout(() => {
              setShowAdContinueModal(true);
            }, 1500);
          } else {
            Logger.log('[GAME] Game over (no options left)');
            setTimeout(() => {
              gameOver();
            }, 1500);
          }
        } else {
          Logger.log(`[GAME] Continue with ${newLives} lives`);
          setTimeout(() => {
            nextQuestion();
          }, 1500);
        }

        return newLives;
      });
    }
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestion + 1 < challenge.questions.length) {
      setCurrentQuestion(prev => prev + 1);
      fadeIn();
    } else {
      // Ensure we are at the last question before completing
      if (currentQuestion === challenge.questions.length - 1) {
        completeChallenge();
      }
    }
  };

  // Game over (no lives left)
  const gameOver = () => {
    Logger.log('[GAME-OVER] 🔴 Game ending, setting gameEndedRef = true');
    gameEndedRef.current = true; // Prevent auto-save FIRST

    // Play failed finish sound
    sfxService.playFailedFinish();

    // Submit score immediately with current values (not from state)
    submitScoreWithValues(false, 0); // completed: false, lives: 0

    // Then update UI state
    setGameState('failed');
  };

  // Complete challenge (all questions answered)
  const completeChallenge = () => {
    Logger.log('[COMPLETE] ✅ Challenge completed, setting gameEndedRef = true');
    gameEndedRef.current = true; // Prevent auto-save FIRST

    // 🎉 CELEBRATION TIME!
    setShowConfetti(true);
    sfxService.playSuccessFinish(); // Victory sound
    Haptics.heavy(); // Victory haptic
    setTimeout(() => Haptics.success(), 200); // Double celebration

    // Submit score immediately
    submitScoreWithValues(true, lives); // completed: true, current lives

    // Then update UI state
    setGameState('complete');
  };

  // Submit score to backend with explicit values
  const submitScoreWithValues = async (isCompleted = false, livesCount = lives) => {
    try {
      const completionTime = Math.floor((Date.now() - startTime) / 1000); // seconds

      // **CRITICAL FIX**: Use answersRef.current instead of answers state (which may be stale)
      const currentAnswers = answersRef.current;
      const correctAnswers = currentAnswers.filter(a => a.isCorrect).length;
      const wrongAnswers = currentAnswers.filter(a => !a.isCorrect).length;

      // **CRITICAL FIX**: Calculate score directly from answersRef to avoid stale state closures
      // The 'answers' state variable may not have the latest value when this function is called
      // immediately after the last correct answer due to React's asynchronous state updates
      const calculatedScore = currentAnswers.reduce((total, answer) => {
        if (answer.isCorrect) {
          // Use stored pointsEarned if available, otherwise fallback to base points
          return total + (answer.pointsEarned || 10);
        }
        return total;
      }, 0);

      Logger.log(`[SUBMIT-SCORE] Calculated score: ${calculatedScore} (state score: ${score}, answers from ref: ${currentAnswers.length})`);

      // **CRITICAL FIX**: Use parameters to avoid stale closures
      const completed = isCompleted;

      // Save progress if not completed (including failures with lives = 0)
      // This allows Heart Refill from Inventory to let users resume from where they failed
      let savedProgress = null;
      if (!completed && currentAnswers.length < challenge.totalQuestions) {
        savedProgress = {
          challenge,
          currentQuestion,
          lives: livesCount, // Will be 0 for failures
          score: calculatedScore,
          answers: currentAnswers,
          usedAdContinue,
          elapsedTime: completionTime * 1000, // Store in milliseconds
        };
        if (livesCount <= 0) {
          Logger.log(`[SAVE-PROGRESS] Saving FAILED progress at Q${currentQuestion + 1}/${challenge.totalQuestions} for Heart Refill resume`);
        } else {
          Logger.log(`[SAVE-PROGRESS] Saving progress at Q${currentQuestion + 1}/${challenge.totalQuestions}, Lives: ${livesCount}`);
        }
      } else if (completed) {
        Logger.log(`[SAVE-PROGRESS] NOT saving - Challenge completed successfully`);
      }

      Logger.log(`[SUBMIT-SCORE] Score: ${calculatedScore}/${challenge.maxScore}, Time: ${completionTime}s, Completed: ${completed}, Questions: ${currentAnswers.length}/${challenge.totalQuestions}, Lives: ${livesCount}, HasProgress: ${!!savedProgress}`);
      Logger.log(`[SUBMIT-SCORE] Username: ${userProfile?.username}, Avatar: ${userProfile?.equippedAvatar}`);

      const requestBody = {
        userId: user.uid,
        displayName: userProfile?.displayName || 'Anonymous',
        username: userProfile?.username || null, // Send username for leaderboard
        score: calculatedScore,
        maxScore: challenge.maxScore,
        completionTime,
        correctAnswers,
        wrongAnswers,
        usedAdContinue,
        completed,
        avatar: userProfile?.equippedAvatar || null, // Send equipped avatar
      };

      // Add savedProgress if exists (for both in-progress AND failed states)
      // Only clear it on successful completion
      if (savedProgress) {
        requestBody.savedProgress = savedProgress;
      } else if (completed) {
        // Only explicitly clear on successful completion
        requestBody.savedProgress = null;
      }

      const response = await fetch(`${BACKEND_URL}/api/daily/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-secret': APP_CLIENT_SECRET
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        Logger.log(`[SUBMIT-SCORE] Success! Streak: ${data.streak?.current || 1}`);
        setStreak(data.streak?.current || 1);
        fetchLeaderboard();
      }
    } catch (error) {
      Logger.error('[SUBMIT-SCORE] Error:', error);
    }
  };

  // Ad Continue Handlers
  const handleWatchAd = async () => {
    Logger.log('[AD-CONTINUE] User chose to watch ad');

    // Check if ad is ready
    if (!rewardedAdService.isAdReady('EXTRA_LIFE')) {
      Alert.alert(
        'Ad Not Ready',
        'The ad is still loading. Please try again in a moment.',
        [
          {
            text: 'Wait for Ad',
            onPress: () => {
              // Keep modal open and preload ad
              rewardedAdService.preloadAd('EXTRA_LIFE');
            }
          },
          {
            text: 'End Game',
            onPress: () => {
              setShowAdContinueModal(false);
              gameOver();
            },
            style: 'destructive'
          },
        ]
      );
      return;
    }

    // Close modal before showing ad
    setShowAdContinueModal(false);

    // Show rewarded ad
    const success = await rewardedAdService.showAd(
      'EXTRA_LIFE',
      // onReward - Called when user earns the reward
      // onReward - Called when user earns the reward
      (reward) => {
        Logger.log('[AD-CONTINUE] Reward earned:', reward);

        // Give user 1 extra life
        setLives(1);
        livesRef.current = 1; // Sync ref
        syncLivesToFirebase(1); // Sync to Firebase
        setUsedAdContinue(true);

        // Show success message
        Alert.alert(
          '❤️ Extra Life Earned!',
          'You got 1 extra life! Keep going!',
          [{
            text: 'Continue',
            onPress: () => {
              // Continue to next question
              setTimeout(() => {
                nextQuestion();
              }, 300);
            }
          }]
        );
      },
      // onClose - Called when ad closes
      () => {
        Logger.log('[AD-CONTINUE] Ad closed');
        // Preload next ad for future use
        rewardedAdService.preloadAd();
      },
      // onError - Called if ad fails
      (error) => {
        Logger.error('[AD-CONTINUE] Ad error:', error);

        Alert.alert(
          'Ad Failed',
          'Sorry, there was an error loading the ad. Would you like to end the game or try again?',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setShowAdContinueModal(true);
                rewardedAdService.loadAd();
              }
            },
            {
              text: 'End Game',
              onPress: () => gameOver(),
              style: 'destructive'
            },
          ]
        );
      }
    );

    if (!success) {
      // If ad failed to show, reopen modal
      setShowAdContinueModal(true);
    }
  };

  const handleDeclineAd = () => {
    Logger.log('[AD-CONTINUE] User declined ad');
    setShowAdContinueModal(false);

    // Game over
    setTimeout(() => {
      gameOver();
    }, 300);
  };

  // Heart Refill Handlers
  const handleUseHeartRefill = async () => {
    Logger.log('[HEART-REFILL] User chose to use Heart Refill potion');

    if (!user?.uid || heartRefillCount <= 0) {
      Logger.log('[HEART-REFILL] Cannot use - no inventory');
      return;
    }

    let potionUsed = false;

    try {
      // Use the potion from inventory
      const success = await shopItemService.useHeartRefill(user.uid);

      if (!success) {
        Logger.error('[HEART-REFILL] Failed to use potion');
        Alert.alert('Error', 'Failed to use Heart Refill. Please try again.');
        return;
      }

      // Potion was successfully decremented from inventory
      potionUsed = true;
      Logger.log('[HEART-REFILL] Potion used successfully!');

      // Close modal
      setShowAdContinueModal(false);

      // Give user 3 lives (full refill)
      setLives(3);
      livesRef.current = 3;
      await syncLivesToFirebase(3);

      // Mark as used in this session
      setUsedHeartRefill(true);

      // Update local inventory count
      setHeartRefillCount(prev => Math.max(0, prev - 1));

      // Show success message
      Alert.alert(
        '❤️ Hearts Refilled!',
        'You got 3 lives! Keep going!',
        [{
          text: 'Continue',
          onPress: () => {
            setTimeout(() => {
              nextQuestion();
            }, 300);
          }
        }]
      );
    } catch (error) {
      Logger.error('[HEART-REFILL] Error:', error);

      // If potion was used but something failed, refund it
      if (potionUsed) {
        Logger.log('[HEART-REFILL] Refunding potion due to error...');
        try {
          await shopItemService.refundHeartRefill(user.uid);
          setHeartRefillCount(prev => prev + 1); // Restore local count
          Alert.alert('Error', 'Could not continue game. Your Heart Refill has been refunded.');
        } catch (refundError) {
          Logger.error('[HEART-REFILL] Refund also failed:', refundError);
          Alert.alert('Error', 'Something went wrong. Please contact support if your Heart Refill is missing.');
        }
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleBuyHeartRefill = () => {
    Logger.log('[HEART-REFILL] User wants to buy Heart Refill');
    setShowAdContinueModal(false);

    // Navigate to shop
    setTimeout(() => {
      navigation.navigate('Shop');
    }, 300);
  };



  // Animations
  const playCorrectAnimation = (points) => {
    // Play correct sound
    sfxService.playCorrect();

    // Scale up and down
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Show score popup
    setPopupScore(`+${points}`);
    Animated.timing(popupAnim, {
      toValue: -60,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setPopupScore(null);
      popupAnim.setValue(0);
    });
  };

  const playWrongAnimation = () => {
    // Play fail sound
    sfxService.playFail();

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Render different game screens
  if (gameState === 'loading') {
    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingText}>Loading today's challenge...</Text>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  // Full-screen leaderboard view (when coming from HomeScreen after completing)
  if (gameState === 'leaderboardOnly') {
    const currentLeaderboardData = leaderboardTab === 'daily' ? leaderboard : weeklyLeaderboard;

    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (challenge && !userRank) {
                    setGameState('start');
                  } else {
                    navigation.goBack();
                  }
                }}
              >
                <Icon name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="trophy" size={22} color="#FFD700" />
                  <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Leaderboards</Text>
                </View>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Tab Switcher */}
            <View style={styles.leaderboardTabContainer}>
              <TouchableOpacity
                style={[
                  styles.leaderboardTabButton,
                  leaderboardTab === 'daily' && styles.leaderboardTabButtonActive
                ]}
                onPress={() => {
                  setLeaderboardTab('daily');
                  if (leaderboard.length === 0) fetchLeaderboard();
                }}
              >
                <Icon name="today-outline" size={18} color={leaderboardTab === 'daily' ? '#FFF' : 'rgba(255,255,255,0.6)'} />
                <Text style={[
                  styles.leaderboardTabText,
                  leaderboardTab === 'daily' && styles.leaderboardTabTextActive
                ]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.leaderboardTabButton,
                  leaderboardTab === 'weekly' && styles.leaderboardTabButtonActive
                ]}
                onPress={() => {
                  setLeaderboardTab('weekly');
                  if (weeklyLeaderboard.length === 0) fetchWeeklyLeaderboard();
                }}
              >
                <Icon name="calendar-outline" size={18} color={leaderboardTab === 'weekly' ? '#FFF' : 'rgba(255,255,255,0.6)'} />
                <Text style={[
                  styles.leaderboardTabText,
                  leaderboardTab === 'weekly' && styles.leaderboardTabTextActive
                ]}>This Week</Text>
              </TouchableOpacity>
            </View>

            {/* Trophy Banner */}
            <View style={styles.leaderboardBanner}>
              <View style={styles.trophyIconContainer}>
                <Icon name="trophy" size={50} color="#FFD700" />
              </View>
              <Text style={styles.bannerTitle}>
                {leaderboardTab === 'daily'
                  ? (userRank ? 'Challenge Complete!' : 'Daily Challenge')
                  : 'Weekly Word Puzzle'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {leaderboardTab === 'daily'
                  ? (userRank ? `You ranked #${userRank} today!` : 'See who\'s leading today')
                  : 'Compete for weekly prizes! 🏆'}
              </Text>
            </View>

            {/* Leaderboard List */}
            <ScrollView
              style={styles.leaderboardScrollView}
              contentContainerStyle={styles.leaderboardScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Daily Prizes Banner */}
              {leaderboardTab === 'daily' && (
                <View style={[styles.weeklyPrizesBanner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.weeklyPrizesTitle}>🏆 Daily Prizes</Text>
                  <View style={styles.weeklyPrizesRow}>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥇</Text>
                      <Text style={styles.weeklyPrizeValue}>100 💎</Text>
                    </View>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥈</Text>
                      <Text style={styles.weeklyPrizeValue}>75 💎</Text>
                    </View>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥉</Text>
                      <Text style={styles.weeklyPrizeValue}>50 💎</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Weekly Prizes Banner */}
              {leaderboardTab === 'weekly' && (
                <View style={[styles.weeklyPrizesBanner, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.weeklyPrizesTitle}>🏆 Weekly Prizes</Text>
                  <View style={styles.weeklyPrizesRow}>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥇</Text>
                      <Text style={styles.weeklyPrizeValue}>1000 💎</Text>
                    </View>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥈</Text>
                      <Text style={styles.weeklyPrizeValue}>750 💎</Text>
                    </View>
                    <View style={styles.weeklyPrizeItem}>
                      <Text style={styles.weeklyPrizeEmoji}>🥉</Text>
                      <Text style={styles.weeklyPrizeValue}>500 💎</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Stats Bar */}
              <View style={[styles.leaderboardStatsBar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                <Icon name="globe-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.leaderboardStatsText}>
                  {currentLeaderboardData.length} players • {leaderboardTab === 'daily' ? 'Today' : 'This Week'}
                </Text>
              </View>

              {/* Loading State */}
              {currentLeaderboardData.length === 0 && (
                <View style={styles.leaderboardEmptyState}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.leaderboardEmptyText}>Loading rankings...</Text>
                </View>
              )}

              {/* Leaderboard Entries */}
              {currentLeaderboardData.map((entry, index) => {
                const isCurrentUser = entry.userId === user?.uid;
                const rankIcon = index === 0 ? 'medal' : index === 1 ? 'medal-outline' : index === 2 ? 'ribbon' : null;
                const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFF';

                // For current user, use their profile data as fallback if entry doesn't have it
                const displayAvatar = isCurrentUser ? (entry.avatar || userProfile?.equippedAvatar) : entry.avatar;
                const displayUsername = isCurrentUser ? (entry.username || userProfile?.username) : entry.username;
                const displayName = displayUsername || entry.displayName || 'Anonymous';

                return (
                  <View
                    key={entry.oderId || entry.oderId || index}
                    style={[
                      styles.leaderboardEntryCard,
                      {
                        // Fixed: Use solid/semi-opaque backgrounds for visibility
                        backgroundColor: activeTheme === 'cyberpunk'
                          ? 'rgba(30, 20, 50, 0.92)'
                          : isDarkMode
                            ? 'rgba(55, 65, 81, 0.88)'
                            : 'rgba(255, 255, 255, 0.85)',
                        // Add subtle border for definition
                        borderWidth: 1,
                        borderColor: activeTheme === 'cyberpunk'
                          ? 'rgba(139, 92, 246, 0.5)'
                          : isDarkMode
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.08)',
                      },
                      isCurrentUser && styles.leaderboardEntryHighlight
                    ]}
                  >
                    <View style={styles.leaderboardRank}>
                      {rankIcon ? (
                        <Icon name={rankIcon} size={24} color={rankColor} />
                      ) : (
                        <Text style={styles.leaderboardRankText}>#{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.leaderboardAvatarContainer}>
                      {(() => {
                        const avatarImage = AVATAR_IMAGES[displayAvatar];
                        if (avatarImage) {
                          return (
                            <Image
                              source={avatarImage}
                              style={styles.leaderboardAvatarImage}
                              resizeMode="cover"
                            />
                          );
                        }
                        // Fallback to first letter of display name
                        const displayChar = displayName?.[0]?.toUpperCase() || '?';
                        return (
                          <View style={styles.leaderboardAvatarFallback}>
                            <Text style={styles.leaderboardAvatarText}>{displayChar}</Text>
                          </View>
                        );
                      })()}
                    </View>
                    <View style={styles.leaderboardEntryInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[
                          styles.leaderboardEntryName,
                          // Theme-aware text color
                          { color: isDarkMode ? '#FFFFFF' : '#1F2937' },
                          isCurrentUser && { color: '#FFD700' }
                        ]}>
                          {displayName}
                        </Text>
                        {isCurrentUser && (
                          <Icon name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 6 }} />
                        )}
                      </View>
                      <Text style={[
                        styles.leaderboardEntryDetails,
                        // Theme-aware secondary text color
                        { color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#4B5563' }
                      ]}>
                        {entry.score} pts • {entry.percentage ? `${entry.percentage}%` : `${Math.round((entry.correctAnswers / (entry.correctAnswers + entry.wrongAnswers)) * 100) || 0}%`}
                      </Text>
                    </View>
                    {index < 3 && (
                      <View style={styles.leaderboardReward}>
                        <Icon name="trophy" size={14} color={isDarkMode ? '#FFD700' : '#D97706'} />
                        <Text style={[
                          styles.leaderboardRewardText,
                          { color: isDarkMode ? '#FFD700' : '#92400E' }
                        ]}>
                          +{index === 0 ? 100 : index === 1 ? 50 : 25}
                        </Text>
                        <Icon name="diamond" size={12} color={isDarkMode ? '#60A5FA' : '#2563EB'} style={{ marginLeft: 2 }} />
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Come Back Tomorrow */}
              {(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dayNum = tomorrow.getDate();
                const monthShort = tomorrow.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                return (
                  <View style={[styles.tomorrowCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                    <View style={styles.calendarIcon}>
                      <Text style={styles.calendarMonth}>{monthShort}</Text>
                      <Text style={styles.calendarDay}>{dayNum}</Text>
                    </View>
                    <Text style={styles.tomorrowText}>New challenge tomorrow!</Text>
                  </View>
                );
              })()}
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  if (gameState === 'alreadyCompleted') {
    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>🎯 Daily Challenge</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.centerContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={[styles.challengeCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardEmoji, { fontSize: 80 }]}>🏆</Text>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Challenge Complete!</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'center', marginTop: 10 }]}>
                  You've already completed today's challenge.{' \n\n '}
                  Come back tomorrow for a fresh challenge!
                </Text>

                <TouchableOpacity
                  style={[styles.startButton, { marginTop: 24, backgroundColor: '#10B981' }]}
                  onPress={() => {
                    fetchLeaderboard();
                    setShowLeaderboard(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startButtonText}>📊 VIEW LEADERBOARD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.startButton, styles.secondaryButton, { marginTop: 16 }]}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.startButtonText, styles.secondaryButtonText, { color: colors.text }]}>GO BACK</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>

          {/* Leaderboard Modal */}
          <LeaderboardModal
            visible={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            leaderboard={leaderboard}
            userRank={userRank}
            userId={user.uid}
            colors={colors}
            isDarkMode={isDarkMode}
            activeTheme={activeTheme}
          />
        </View>
      </ImageBackground>
    );
  }

  if (gameState === 'start' && challenge) {
    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          {/* Render a transparent game background, so the modal appears over it */}
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
          <GameStartModal
            visible={true}
            onStart={startChallenge}
            colors={colors}
            isDarkMode={isDarkMode}
            challengeTitle={challenge?.title || 'Daily Challenge'}
          />
        </View>
      </ImageBackground>
    );
  }

  if (gameState === 'playing') {
    const question = challenge.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / challenge.totalQuestions) * 100;

    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <SafeAreaView style={styles.safeArea}>
            {/* Header with lives and progress */}
            <View style={styles.gameHeader}>
              <View style={styles.livesContainer}>
                {[1, 2, 3].map(i => (
                  <Text key={i} style={styles.heartIcon}>
                    {i <= lives ? '❤️' : '🖤'}
                  </Text>
                ))}
              </View>
              <View style={styles.questionProgress}>
                <Text style={styles.questionNumber}>
                  Question {currentQuestion + 1}/{challenge.totalQuestions}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{score} pts</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            {/* Combo Meter */}
            <ComboMeter combo={combo} multiplier={1 + (combo * 0.1)} />

            {/* Question Card - Wrapped in ScrollView for small screens */}
            <ShakeView trigger={shakeTrigger} style={{ flex: 1, width: '100%' }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <Animated.View
                  style={[
                    styles.questionCard,
                    { backgroundColor: isDarkMode ? 'rgba(30, 30, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)' },
                    {
                      opacity: fadeAnim,
                      transform: [
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                >
                  <Text style={[styles.questionType, { color: colors.primary || '#6e3ff0' }]}>{question.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>

                  {/* Language hint from backend */}
                  {question.hint && (
                    <View style={[styles.hintContainer, { backgroundColor: isDarkMode ? 'rgba(110, 63, 240, 0.15)' : '#F3E8FF' }]}>
                      <Icon name="information-circle" size={16} color={colors.primary || '#6e3ff0'} />
                      <Text style={[styles.hintText, { color: colors.primary || '#6e3ff0' }]}>{question.hint}</Text>
                    </View>
                  )}

                  <View style={[styles.wordDisplay, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                    <Text style={[styles.wordText, { color: colors.text }]}>{question.word}</Text>
                    {question.wordLanguageNative && (
                      <Text style={[styles.wordLanguageText, { color: colors.primary || '#6e3ff0' }]}>{question.wordLanguageNative}</Text>
                    )}
                  </View>

                  {/* Options */}
                  <View style={styles.optionsContainer}>
                    {question.options.map((option, index) => (
                      <AnimatedButton
                        key={index}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F9FAFB',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
                          },
                          (showAdContinueModal || lives <= 0) && styles.optionButtonDisabled
                        ]}
                        onPress={() => handleAnswer(option)}
                        disabled={showAdContinueModal || lives <= 0}
                        hapticType={null} // We handle haptics in handleAnswer
                        scaleValue={0.95}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: colors.text },
                          (showAdContinueModal || lives <= 0) && styles.optionTextDisabled
                        ]}>{option}</Text>
                      </AnimatedButton>
                    ))}
                  </View>
                </Animated.View>
              </ScrollView>
            </ShakeView>

            {/* Score Popup */}
            {popupScore && (
              <Animated.View
                style={[
                  styles.scorePopup,
                  { transform: [{ translateY: popupAnim }] },
                ]}
              >
                <Text style={styles.scorePopupText}>{popupScore}</Text>
              </Animated.View>
            )}
          </SafeAreaView>

          {/* Celebration Effects */}
          <ParticleBurst trigger={particleTrigger} emoji="⭐" />
          <FloatingHearts trigger={heartsTrigger} />

          {/* Ad Continue Modal */}
          <AdContinueModal
            visible={showAdContinueModal}
            onContinue={handleWatchAd}
            onDecline={handleDeclineAd}
            heartRefillCount={heartRefillCount}
            onUseHeartRefill={handleUseHeartRefill}
            onBuyHeartRefill={handleBuyHeartRefill}
            showAdOption={!usedAdContinue}
          />
        </View>
      </ImageBackground>
    );
  }

  if (gameState === 'complete' || gameState === 'failed') {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect).length;
    const percentage = Math.round((score / challenge.maxScore) * 100);

    return (
      <ImageBackground
        source={GAME_BACKGROUNDS.PUZZLE}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.resultsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.resultsEmoji}>
                {gameState === 'complete' ? '🎉' : '😔'}
              </Text>
              <Text style={styles.resultsTitle}>
                {gameState === 'complete' ? 'Challenge Complete!' : 'Game Over'}
              </Text>

              {/* Score Card */}
              <View style={styles.resultsCard}>
                <Text style={styles.resultsLabel}>Your Score</Text>
                <Text style={styles.resultsScore}>{score} / {challenge.maxScore}</Text>
                <Text style={styles.resultsPercentage}>{percentage}%</Text>

                <View style={styles.resultsDivider} />

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statEmoji}>✅</Text>
                    <Text style={styles.statValue}>{correctCount}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statEmoji}>❌</Text>
                    <Text style={styles.statValue}>{wrongCount}</Text>
                    <Text style={styles.statLabel}>Wrong</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statEmoji}>❤️</Text>
                    <Text style={styles.statValue}>{lives}</Text>
                    <Text style={styles.statLabel}>Lives Left</Text>
                  </View>
                </View>

                {userRank && (
                  <>
                    <View style={styles.resultsDivider} />
                    <View style={styles.rankSection}>
                      <Text style={styles.rankLabel}>Your Rank</Text>
                      <Text style={styles.rankValue}>#{userRank}</Text>
                    </View>
                  </>
                )}

                {streak > 0 && (
                  <View style={styles.streakResult}>
                    <Text style={styles.streakResultText}>🔥 {streak}-day streak!</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.resultButton}
                onPress={() => {
                  navigation.navigate('Leaderboards', { initialTab: 'daily' });
                }}
              >
                <Text style={styles.resultButtonText}>📊 View Leaderboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resultButton, styles.secondaryButton]}
                onPress={() => {
                  // Reset navigation stack to Home to ensure we always go home
                  // regardless of where the user came from (e.g., Inventory after Heart Refill)
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                }}
              >
                <Text style={[styles.resultButtonText, styles.secondaryButtonText]}>
                  Back to Home
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>

          {/* Victory Confetti */}
          {gameState === 'complete' && (
            <ConfettiCelebration trigger={showConfetti} />
          )}

          {/* Leaderboard Modal */}
          <LeaderboardModal
            visible={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            leaderboard={leaderboard}
            userRank={userRank}
            userId={user.uid}
            colors={colors}
            isDarkMode={isDarkMode}
            activeTheme={activeTheme}
          />

          {/* Polished Resume Overlay */}
          {showResumeOverlay && resumeInfo && (
            <Animated.View
              style={[
                styles.resumeOverlay,
                {
                  opacity: resumeOverlayAnim,
                  transform: [
                    {
                      scale: resumeOverlayAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(110, 63, 240, 0.98)', 'rgba(168, 79, 232, 0.95)']}
                style={styles.resumeOverlayContent}
              >
                <View style={styles.resumeIconContainer}>
                  <Icon name="pause-circle" size={64} color="#FFF" />
                </View>

                <Text style={styles.resumeTitle}>Welcome Back!</Text>
                <Text style={styles.resumeSubtitle}>Ready to continue?</Text>

                {/* Stats Row */}
                <View style={styles.resumeStatsRow}>
                  <View style={styles.resumeStatItem}>
                    <Icon name="clipboard-outline" size={24} color="#FFF" />
                    <Text style={styles.resumeStatValue}>
                      Q{resumeInfo.currentQuestion}/{resumeInfo.totalQuestions}
                    </Text>
                    <Text style={styles.resumeStatLabel}>Progress</Text>
                  </View>
                  <View style={styles.resumeStatDivider} />
                  <View style={styles.resumeStatItem}>
                    <Icon name="heart" size={24} color="#EF4444" />
                    <Text style={styles.resumeStatValue}>
                      {resumeInfo.lives}
                    </Text>
                    <Text style={styles.resumeStatLabel}>Lives Left</Text>
                  </View>
                  <View style={styles.resumeStatDivider} />
                  <View style={styles.resumeStatItem}>
                    <Icon name="star" size={24} color="#FCD34D" />
                    <Text style={styles.resumeStatValue}>
                      {resumeInfo.score}
                    </Text>
                    <Text style={styles.resumeStatLabel}>Points</Text>
                  </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={styles.resumeContinueButton}
                  onPress={handleResumeContinue}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.resumeContinueGradient}
                  >
                    <Icon name="play-circle" size={28} color="#FFF" />
                    <Text style={styles.resumeContinueText}>Continue Challenge</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Progress Bar */}
                <View style={styles.resumeProgressContainer}>
                  <View
                    style={[
                      styles.resumeProgressBar,
                      { width: `${((resumeInfo.currentQuestion - 1) / resumeInfo.totalQuestions) * 100}%` }
                    ]}
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </ImageBackground>
    );
  }

  return null;
};

// Leaderboard Modal Component
const LeaderboardModal = ({ visible, onClose, leaderboard, userId, colors, isDarkMode, activeTheme }) => {
  const isCyberpunk = activeTheme === 'cyberpunk';
  // Avatar mapping for display
  const AVATAR_MAP = {
    'avatar_fox': '🦊',
    'avatar_robot': '🤖',
    'avatar_owl': '🦉',
    'avatar_cat': '🐱',
    'avatar_rocket': '🚀',
    'avatar_star': '⭐',
    'avatar_bear': '🐻',
    'avatar_panda': '🐼',
  };

  const getAvatarDisplay = (entry) => {
    if (entry.avatar && AVATAR_MAP[entry.avatar]) {
      return AVATAR_MAP[entry.avatar];
    }
    // Fallback to first letter of name
    return entry.displayName?.[0]?.toUpperCase() || '?';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors?.card || '#FFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors?.text || '#333' }]}>🏆 Today's Leaderboard</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={28} color={colors?.text || '#333'} />
            </TouchableOpacity>
          </View>

          {leaderboard.length === 0 ? (
            <View style={styles.emptyLeaderboard}>
              <Text style={[styles.emptyText, { color: colors?.text || '#333' }]}>No entries yet!</Text>
              <Text style={[styles.emptySubtext, { color: colors?.textSecondary || '#666' }]}>Be the first to complete today's challenge</Text>
            </View>
          ) : (
            <>
              <View style={[styles.leaderboardStats, { backgroundColor: isDarkMode ? 'rgba(110, 63, 240, 0.15)' : '#F3E8FF' }]}>
                <Text style={[styles.statsText, { color: colors?.text || '#333' }]}>
                  🌍 {leaderboard.length} players • Global Leaderboard
                </Text>
                <Text style={[styles.statsText, { fontSize: 11, marginTop: 4, opacity: 0.7, color: colors?.textSecondary || '#666' }]}>
                  ✅ Completed • ❌ Partial Score
                </Text>
              </View>

              <ScrollView style={styles.leaderboardList} showsVerticalScrollIndicator={false}>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === userId;
                  const rankDisplay = entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`;
                  const avatarEmoji = getAvatarDisplay(entry);
                  const isEmoji = typeof avatarEmoji === 'string' && avatarEmoji.length <= 2;

                  return (
                    <View
                      key={entry.oderId || entry.oderId || index}
                      style={[
                        styles.leaderboardEntry,
                        {
                          // Theme-specific backgrounds with good visibility
                          backgroundColor: isCyberpunk
                            ? 'rgba(30, 20, 50, 0.95)'
                            : isDarkMode
                              ? 'rgba(55, 65, 81, 0.9)'
                              : 'rgba(249, 250, 251, 0.98)',
                          borderBottomColor: isCyberpunk
                            ? 'rgba(139, 92, 246, 0.5)'
                            : isDarkMode
                              ? 'rgba(255,255,255,0.2)'
                              : '#E5E7EB',
                          // Cyberpunk glow border
                          borderWidth: isCyberpunk ? 1 : 0,
                          borderColor: isCyberpunk ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                        },
                        isCurrentUser && [styles.userEntry, {
                          backgroundColor: isCyberpunk
                            ? 'rgba(139, 92, 246, 0.4)'
                            : isDarkMode
                              ? 'rgba(110, 63, 240, 0.5)'
                              : '#E8DCFA',
                          borderWidth: 2,
                          borderColor: isCyberpunk ? '#ff2d95' : '#6e3ff0',
                        }],
                      ]}
                    >
                      {/* Rank */}
                      <View style={[styles.rankBadge, { minWidth: 36 }]}>
                        <Text style={styles.rankText}>{rankDisplay}</Text>
                      </View>

                      {/* Avatar */}
                      <View style={[
                        styles.avatarContainer,
                        {
                          backgroundColor: isEmoji
                            ? (isDarkMode ? 'rgba(110, 63, 240, 0.3)' : '#E8DCFA')
                            : (isDarkMode ? 'rgba(255,255,255,0.2)' : '#E5E7EB'),
                        }
                      ]}>
                        <Text style={styles.avatarText}>{avatarEmoji}</Text>
                      </View>

                      {/* Info */}
                      <View style={styles.entryInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.entryName,
                              { color: colors?.text || '#333' },
                              isCurrentUser && { fontWeight: '700', color: '#6e3ff0' }
                            ]}
                            numberOfLines={1}
                          >
                            {entry.username || entry.displayName || 'Anonymous'}
                          </Text>
                          {entry.completed ? (
                            <Text style={{ fontSize: 12 }}>✅</Text>
                          ) : (
                            <Text style={{ fontSize: 12, opacity: 0.5 }}>❌</Text>
                          )}
                        </View>
                        <Text style={[styles.entryDetails, { color: colors?.textSecondary || '#666' }]}>
                          {entry.score} pts • {entry.percentage || Math.round((entry.correctAnswers / (entry.correctAnswers + entry.wrongAnswers)) * 100) || 0}%
                        </Text>
                      </View>

                      {/* Reward for top 3 */}
                      {entry.rank <= 3 && (
                        <View style={styles.rewardBadge}>
                          <Text style={styles.rewardText}>
                            +{entry.rank === 1 ? 100 : entry.rank === 2 ? 50 : 25}💎
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  startContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  startScrollView: {
    flex: 1,
  },
  startScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  challengeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  startButton: {
    backgroundColor: '#6e3ff0',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#6e3ff0',
  },
  secondaryButtonText: {
    color: '#6e3ff0',
  },
  leaderboardButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  leaderboardButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 16,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  heartIcon: {
    fontSize: 24,
  },
  questionProgress: {
    flex: 1,
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  scoreContainer: {},
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  questionCard: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
  },
  questionType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e3ff0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    color: '#6e3ff0',
    fontWeight: '500',
    flex: 1,
  },
  wordDisplay: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  wordLanguageText: {
    fontSize: 14,
    color: '#6e3ff0',
    fontWeight: '600',
    marginTop: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  optionButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.5,
  },
  optionTextDisabled: {
    color: '#9CA3AF',
  },
  scorePopup: {
    position: 'absolute',
    top: height / 2,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  scorePopupText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  resultsScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80, // Increased to clear status bar comfortably
    paddingBottom: 40, // Add bottom padding for scrolling
    alignItems: 'center',
    flexGrow: 1, // Ensure it takes full height if content is small
  },
  resultsEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 32,
  },
  resultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#333',
  },
  resultsPercentage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6e3ff0',
    marginBottom: 24,
  },
  resultsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  rankSection: {
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  rankValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6e3ff0',
  },
  streakResult: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  streakResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  resultButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  resultButtonText: {
    color: '#6e3ff0',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  secondaryButtonText: {
    color: '#FFF',
  },
  // Modal styles - FULL SCREEN instead of bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFF', // Solid background for full screen
  },
  modalContent: {
    flex: 1, // Full screen height
    backgroundColor: '#FFF',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  emptyLeaderboard: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  leaderboardStats: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  leaderboardList: {
    paddingHorizontal: 24,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userEntry: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6e3ff0',
  },
  rankBadge: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  entryDetails: {
    fontSize: 12,
    color: '#999',
  },
  entryStreak: {
    fontSize: 14,
    marginLeft: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
  },
  // Leaderboard avatar styles
  leaderboardAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  leaderboardAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  leaderboardAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardAvatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardBadge: {
    backgroundColor: 'rgba(110, 63, 240, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e3ff0',
  },

  // Resume Overlay Styles
  resumeOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  resumeCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resumeIconContainer: {
    marginBottom: 16,
  },
  resumeIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  resumeTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  resumeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  resumeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  resumeStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resumeStatText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resumeProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  resumeProgressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  // Full-screen Leaderboard Styles
  leaderboardBanner: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  trophyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardScrollView: {
    flex: 1,
  },
  leaderboardScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  leaderboardStatsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  leaderboardStatsText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  leaderboardEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  leaderboardEmptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
  leaderboardEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  leaderboardEntryHighlight: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  leaderboardRankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  leaderboardEntryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardEntryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  leaderboardEntryDetails: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  leaderboardReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaderboardRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 4,
  },
  tomorrowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    gap: 12,
  },
  tomorrowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  calendarIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  calendarMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    backgroundColor: '#EF4444',
    width: '100%',
    textAlign: 'center',
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  calendarDay: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: -2,
  },
  // Leaderboard Tab Styles
  leaderboardTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  leaderboardTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  leaderboardTabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  leaderboardTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  leaderboardTabTextActive: {
    color: '#FFF',
  },
  // Weekly Prizes Banner
  weeklyPrizesBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  weeklyPrizesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  weeklyPrizesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyPrizeItem: {
    alignItems: 'center',
  },
  weeklyPrizeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  weeklyPrizeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // Game Start Modal Styles
  startModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  startModalGradient: {
    borderRadius: 24,
    padding: 2, // Border width
  },
  startModalContainer: {
    width: '90%',
    maxWidth: 320,
    borderRadius: 22, // Inner radius
    padding: 24,
    alignItems: 'center',
  },
  startModalHeader: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  startModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  startModalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default DailyGameScreen;
