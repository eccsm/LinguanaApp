import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/logger';

const WALKTHROUGH_STORAGE_KEY = '@linguana_walkthrough_complete';

const WalkthroughContext = createContext();

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (!context) {
        throw new Error('useWalkthrough must be used within WalkthroughProvider');
    }
    return context;
};

// Walkthrough steps configuration - these reference actual UI elements
export const WALKTHROUGH_STEPS = [
    {
        id: 'scenario',
        title: 'Start a Conversation',
        description: 'Tap any scenario to practice speaking with AI tutors',
        targetKey: 'scenario-card', // Key to identify element
        position: 'bottom', // Tooltip position relative to target
        icon: 'chat-processing',
        borderRadius: 20,
    },
    {
        id: 'daily',
        title: 'Daily Challenge',
        description: 'Complete word puzzles every day to earn XP and maintain your streak',
        targetKey: 'daily-challenge-card',
        position: 'top',
        icon: 'puzzle',
        borderRadius: 20,
    },
    {
        id: 'streak',
        title: 'Track Your Streak',
        description: 'This shows your daily practice streak - keep it alive!',
        targetKey: 'streak-badge',
        position: 'bottom',
        icon: 'fire',
        yOffset: 12, // Move down to encompass badge
        heightAdded: 10, // Increase height slightly
        borderRadius: 50, // Pill shape
    },
    {
        id: 'complete',
        title: "You're All Set! 🎉",
        description: 'Explore all features and start your language journey!',
        targetKey: null, // No target, show centered modal
        position: 'center',
        icon: 'rocket-launch',
    },
];

export const WalkthroughProvider = ({ children }) => {
    const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [hasCompletedWalkthrough, setHasCompletedWalkthrough] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Store target element measurements
    const [targetMeasurements, setTargetMeasurements] = useState({});
    const targetRefs = useRef({});

    // Check if walkthrough was completed on mount
    useEffect(() => {
        const checkWalkthroughStatus = async () => {
            try {
                const completed = await AsyncStorage.getItem(WALKTHROUGH_STORAGE_KEY);
                setHasCompletedWalkthrough(completed === 'true');
                Logger.log('[Walkthrough] Status:', completed === 'true' ? 'completed' : 'not completed');
            } catch (error) {
                Logger.error('[Walkthrough] Error checking status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkWalkthroughStatus();
    }, []);

    // Register a target element
    const registerTarget = useCallback((key, ref) => {
        targetRefs.current[key] = ref;
    }, []);

    // Measure a target element's position with retries
    const measureTarget = useCallback((key, attempts = 0) => {
        return new Promise((resolve) => {
            const ref = targetRefs.current[key];
            Logger.log(`[Walkthrough] Measuring target: ${key}, attempt: ${attempts + 1}`);

            if (ref) {
                const handleMeasurement = (x, y, width, height, pageX, pageY) => {
                    // Use pageX/pageY if available (from measure), otherwise x/y (from measureInWindow)
                    const finalX = pageX !== undefined ? pageX : x;
                    const finalY = pageY !== undefined ? pageY : y;

                    Logger.log('[Walkthrough] Measurement result:', { x: finalX, y: finalY, width, height });

                    // Check if measurement is valid (non-zero dimensions)
                    // On Android, sometimes pageX/Y are 0 if off-screen, but width/height are valid
                    if (width > 0 && height > 0) {
                        const measurement = { x: finalX, y: finalY, width, height };
                        setTargetMeasurements(prev => ({ ...prev, [key]: measurement }));
                        resolve(measurement);
                    } else {
                        // Retry if dimensions are 0 (layout not ready or off-screen)
                        if (attempts < 10) { // Increased retries from 5 to 10
                            setTimeout(() => {
                                measureTarget(key, attempts + 1).then(resolve);
                            }, 300);
                        } else {
                            Logger.warn('[Walkthrough] Failed to measure target after retries:', key);
                            resolve(null);
                        }
                    }
                };

                // Try measureInWindow first (absolute screen coordinates)
                if (typeof ref.measureInWindow === 'function') {
                    ref.measureInWindow((x, y, width, height) => {
                        // If measureInWindow returns all 0s, try fallback to measure
                        if ((width === 0 && height === 0) && typeof ref.measure === 'function') {
                            ref.measure((x, y, width, height, pageX, pageY) =>
                                handleMeasurement(x, y, width, height, pageX, pageY));
                        } else {
                            handleMeasurement(x, y, width, height);
                        }
                    });
                } else if (typeof ref.measure === 'function') {
                    ref.measure((x, y, width, height, pageX, pageY) =>
                        handleMeasurement(x, y, width, height, pageX, pageY));
                } else {
                    Logger.warn('[Walkthrough] No measure method available for:', key);
                    resolve(null);
                }
            } else {
                // Retry if ref is missing (maybe not mounted yet)
                if (attempts < 15) { // Increased retries from 10 to 15
                    Logger.log(`[Walkthrough] Ref missing for ${key}, retrying...`);
                    setTimeout(() => {
                        measureTarget(key, attempts + 1).then(resolve);
                    }, 500);
                } else {
                    Logger.warn('[Walkthrough] Ref not found after retries for:', key);
                    resolve(null);
                }
            }
        });
    }, []);

    // Measure all targets for current step
    const measureCurrentTarget = useCallback(async () => {
        const step = WALKTHROUGH_STEPS[currentStepIndex];
        if (step?.targetKey) {
            await measureTarget(step.targetKey);
        }
    }, [currentStepIndex, measureTarget]);

    // Start the walkthrough
    const startWalkthrough = useCallback(() => {
        Logger.log('[Walkthrough] Starting walkthrough');
        setCurrentStepIndex(0);
        setIsWalkthroughActive(true);
        // Delay measurement to let UI render (longer for tablets)
        setTimeout(() => {
            measureTarget(WALKTHROUGH_STEPS[0]?.targetKey);
        }, 600);
    }, [measureTarget]);

    // Go to next step
    const nextStep = useCallback(async () => {
        if (currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            Logger.log('[Walkthrough] Moving to step:', nextIndex);

            // Measure the next target
            const nextStep = WALKTHROUGH_STEPS[nextIndex];
            if (nextStep?.targetKey) {
                setTimeout(() => {
                    measureTarget(nextStep.targetKey);
                }, 200);
            }
        } else {
            // Complete the walkthrough
            completeWalkthrough();
        }
    }, [currentStepIndex, measureTarget]);

    // Skip/complete the walkthrough
    const completeWalkthrough = useCallback(async () => {
        Logger.log('[Walkthrough] Completing walkthrough');
        setIsWalkthroughActive(false);
        setHasCompletedWalkthrough(true);
        setCurrentStepIndex(0);

        try {
            await AsyncStorage.setItem(WALKTHROUGH_STORAGE_KEY, 'true');
        } catch (error) {
            Logger.error('[Walkthrough] Error saving completion:', error);
        }
    }, []);

    // Reset walkthrough (for "Replay Tutorial")
    const resetWalkthrough = useCallback(async () => {
        Logger.log('[Walkthrough] Resetting walkthrough');
        try {
            await AsyncStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
            setHasCompletedWalkthrough(false);
            // Don't start immediately - let HomeScreen trigger it
        } catch (error) {
            Logger.error('[Walkthrough] Error resetting:', error);
        }
    }, []);

    // Trigger walkthrough for new users
    const triggerForNewUser = useCallback(() => {
        if (!hasCompletedWalkthrough && !isLoading) {
            startWalkthrough();
        }
    }, [hasCompletedWalkthrough, isLoading, startWalkthrough]);

    const currentStep = WALKTHROUGH_STEPS[currentStepIndex];
    const currentTargetMeasurement = currentStep?.targetKey
        ? targetMeasurements[currentStep.targetKey]
        : null;
    const totalSteps = WALKTHROUGH_STEPS.length;
    const progress = (currentStepIndex + 1) / totalSteps;

    // Re-measure the current target (e.g. after scrolling)
    const reMeasure = useCallback(() => {
        const step = WALKTHROUGH_STEPS[currentStepIndex];
        if (step?.targetKey) {
            measureTarget(step.targetKey);
        }
    }, [currentStepIndex, measureTarget]);

    const value = {
        isWalkthroughActive,
        currentStep,
        currentStepIndex,
        totalSteps,
        progress,
        hasCompletedWalkthrough,
        isLoading,
        currentTargetMeasurement,
        targetMeasurements,
        registerTarget,
        measureTarget,
        measureCurrentTarget,
        startWalkthrough,
        nextStep,
        completeWalkthrough,
        resetWalkthrough,
        triggerForNewUser,
        reMeasure, // Exposed for external triggers (like scroll completion)
    };

    return (
        <WalkthroughContext.Provider value={value}>
            {children}
        </WalkthroughContext.Provider>
    );
};

export default WalkthroughContext;
