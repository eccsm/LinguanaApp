/**
 * useLetterSelection Hook
 * Handles PanResponder-based swipe detection for the letter wheel
 * 
 * Features:
 * - Velocity-based filtering to prevent accidental intermediate letter selection
 * - Dwell time requirement for fast swipes
 * - Closest letter detection within hit radius
 */

import { useRef, useCallback, useMemo } from 'react';
import { PanResponder, GestureResponderEvent } from 'react-native';
import Haptics from '../utils/haptics';

// ============================================================================
// Types
// ============================================================================

interface Position {
    x: number;
    y: number;
}

interface UseLetterSelectionParams {
    /** Array of letters available for selection */
    letters: string[];
    /** Center positions of each letter bubble for hit detection */
    letterPositions: Position[];
    /** Radius around each letter center for touch detection */
    hitRadius: number;
    /** Callback when a new letter is selected */
    onSelectLetter: (index: number) => void;
    /** Callback when the selection gesture ends (finger lifted) */
    onSubmit: () => void;
    /** Whether the wheel should respond to gestures */
    enabled?: boolean;
}

interface UseLetterSelectionReturn {
    /** PanResponder handlers to attach to the touch capture view */
    panResponder: ReturnType<typeof PanResponder.create>;
    /** Reset the internal tracking state */
    reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

// Minimum time (ms) finger must dwell on a letter before it's selected when moving fast
const DWELL_TIME_THRESHOLD = 40;
// Velocity threshold (pixels/second) above which we require dwell time
const VELOCITY_THRESHOLD = 400;
// How much closer (ratio) the finger must be to new letter vs current to switch
const SWITCH_DISTANCE_RATIO = 0.6;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useLetterSelection({
    letters,
    letterPositions,
    hitRadius,
    onSelectLetter,
    onSubmit,
    enabled = true,
}: UseLetterSelectionParams): UseLetterSelectionReturn {
    // Track which letter the finger is currently over to avoid duplicate callbacks
    const lastHitIndexRef = useRef(-1);

    // Track selected indices for backtracking detection
    const selectedIndicesRef = useRef<number[]>([]);

    // Track position and time for velocity calculation
    const lastPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

    // Track when we entered the current candidate letter
    const candidateRef = useRef<{ index: number; enteredAt: number }>({ index: -1, enteredAt: 0 });

    /**
     * Find which letter (if any) the touch point is over
     * Returns the CLOSEST letter within hit radius to prevent mis-selection
     */
    const findHitLetter = useCallback((x: number, y: number): number => {
        let closestIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < letters.length; i++) {
            const pos = letterPositions[i];
            if (!pos) continue;

            const dx = x - pos.x;
            const dy = y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only consider letters within hit radius
            if (dist <= hitRadius && dist < closestDistance) {
                closestDistance = dist;
                closestIndex = i;
            }
        }
        return closestIndex;
    }, [letters.length, letterPositions, hitRadius]);

    /**
     * Calculate distance to a specific letter
     */
    const getDistanceToLetter = useCallback((x: number, y: number, letterIndex: number): number => {
        const pos = letterPositions[letterIndex];
        if (!pos) return Infinity;
        const dx = x - pos.x;
        const dy = y - pos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }, [letterPositions]);

    /**
     * Handle gesture movement - called on both grant and move
     * Implements velocity-aware selection to prevent accidental intermediate selections
     */
    const handleGesture = useCallback((x: number, y: number) => {
        if (!enabled) return;

        const now = Date.now();
        const lastPos = lastPosRef.current;

        // Calculate velocity
        const timeDelta = now - lastPos.time;
        const dx = x - lastPos.x;
        const dy = y - lastPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = timeDelta > 0 ? (distance / timeDelta) * 1000 : 0; // pixels/second

        // Update position tracking
        lastPosRef.current = { x, y, time: now };

        const hitIndex = findHitLetter(x, y);
        const currentIndex = lastHitIndexRef.current;

        // Not over any letter - clear candidate
        if (hitIndex === -1) {
            candidateRef.current = { index: -1, enteredAt: 0 };
            return;
        }

        // Still on the same letter - no action needed
        if (hitIndex === currentIndex) {
            candidateRef.current = { index: -1, enteredAt: 0 };
            return;
        }

        // New potential letter detected
        const candidate = candidateRef.current;

        // Check if this is the same candidate we were tracking
        if (candidate.index !== hitIndex) {
            // New candidate - start tracking
            candidateRef.current = { index: hitIndex, enteredAt: now };
        }

        // Determine if we should select this letter
        let shouldSelect = false;

        // For the first letter (no current selection), always select immediately
        if (currentIndex === -1) {
            shouldSelect = true;
        }
        // If moving slowly, select immediately
        else if (velocity < VELOCITY_THRESHOLD) {
            shouldSelect = true;
        }
        // If moving fast, require dwell time OR significantly closer distance
        else {
            const dwellTime = now - candidateRef.current.enteredAt;
            const distToNew = getDistanceToLetter(x, y, hitIndex);
            const distToCurrent = currentIndex >= 0 ? getDistanceToLetter(x, y, currentIndex) : Infinity;

            // Select if dwelled long enough OR if new letter is much closer
            if (dwellTime >= DWELL_TIME_THRESHOLD || distToNew < distToCurrent * SWITCH_DISTANCE_RATIO) {
                shouldSelect = true;
            }
        }

        if (!shouldSelect) return;

        // Update tracking
        lastHitIndexRef.current = hitIndex;
        candidateRef.current = { index: -1, enteredAt: 0 };

        const currentSelected = selectedIndicesRef.current;
        const beforeLastIndex = currentSelected[currentSelected.length - 2];

        // Check if this is a backtrack (moving back to previous letter)
        if (currentSelected.includes(hitIndex)) {
            if (currentSelected.length > 1 && beforeLastIndex === hitIndex) {
                // Backtrack - remove the last letter
                selectedIndicesRef.current = currentSelected.slice(0, -1);
                onSelectLetter(hitIndex); // This will trigger the backtrack in parent
                Haptics.light();
            }
            // Already selected but not backtracking - do nothing
            return;
        }

        // New letter selected
        selectedIndicesRef.current = [...currentSelected, hitIndex];
        onSelectLetter(hitIndex);
        Haptics.light();
    }, [enabled, findHitLetter, getDistanceToLetter, onSelectLetter]);

    /**
     * Handle gesture end
     */
    const handleRelease = useCallback(() => {
        lastHitIndexRef.current = -1;
        selectedIndicesRef.current = [];
        candidateRef.current = { index: -1, enteredAt: 0 };
        onSubmit();
    }, [onSubmit]);

    /**
     * Reset internal state (useful when puzzle resets)
     */
    const reset = useCallback(() => {
        lastHitIndexRef.current = -1;
        selectedIndicesRef.current = [];
        candidateRef.current = { index: -1, enteredAt: 0 };
    }, []);

    /**
     * Create PanResponder
     */
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: () => enabled,

        onPanResponderGrant: (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            // Reset velocity tracking on new gesture
            lastPosRef.current = { x: locationX, y: locationY, time: Date.now() };
            handleGesture(locationX, locationY);
        },

        onPanResponderMove: (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            handleGesture(locationX, locationY);
        },

        onPanResponderRelease: () => {
            handleRelease();
        },

        onPanResponderTerminate: () => {
            handleRelease();
        },
    }), [enabled, handleGesture, handleRelease]);

    return {
        panResponder,
        reset,
    };
}

export default useLetterSelection;

