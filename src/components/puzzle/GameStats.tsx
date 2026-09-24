/**
 * GameStats Component
 * Displays score, progress, and hint button with animated Tip/Hint buttons
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ============================================================================
// Types
// ============================================================================

interface GameStatsProps {
    /** Current score */
    score: number;
    /** Number of words found */
    foundCount: number;
    /** Total number of words in puzzle */
    totalCount: number;
    /** Callback when hint button is pressed */
    onHint: () => void;
    /** Whether hint button is enabled */
    hintEnabled?: boolean;
    /** Callback when tip button is pressed */
    onTip?: () => void;
    /** Whether tip button is enabled */
    tipEnabled?: boolean;
    /** Compact mode for small screens */
    compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function GameStats({
    score,
    foundCount,
    totalCount,
    onHint,
    hintEnabled = true,
    onTip,
    tipEnabled = true,
    compact = false,
}: GameStatsProps) {
    const progressPercent = totalCount > 0 ? (foundCount / totalCount) * 100 : 0;

    // Pulse animations for Tip and Hint buttons
    const tipPulse = useRef(new Animated.Value(1)).current;
    const hintPulse = useRef(new Animated.Value(1)).current;

    // Animate Tip button when enabled
    useEffect(() => {
        if (tipEnabled && onTip) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(tipPulse, {
                        toValue: 1.08,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(tipPulse, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        }
    }, [tipEnabled, onTip, tipPulse]);

    // Animate Hint button when enabled
    useEffect(() => {
        if (hintEnabled) {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(hintPulse, {
                        toValue: 1.08,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(hintPulse, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        }
    }, [hintEnabled, hintPulse]);

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {/* Score Badge */}
            <View style={[styles.statBadge, compact && styles.statBadgeCompact]}>
                <Icon name="star" size={compact ? 14 : 18} color="#FFD700" />
                <Text style={[styles.statText, compact && styles.statTextCompact]}>{score}</Text>
            </View>

            {/* Progress Badge */}
            <View style={[styles.statBadge, styles.progressBadge, compact && styles.statBadgeCompact]}>
                <Icon name="checkmark-circle" size={compact ? 14 : 18} color="#4CAF50" />
                <Text style={[styles.statText, compact && styles.statTextCompact]}>
                    {foundCount}/{totalCount}
                </Text>
                {/* Mini progress bar */}
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>
            </View>

            {/* Tip Button - Shows translation hint */}
            {onTip && (
                <Animated.View style={{ transform: [{ scale: tipPulse }] }}>
                    <TouchableOpacity
                        onPress={onTip}
                        style={[
                            styles.tipButton,
                            compact && styles.buttonCompact,
                            !tipEnabled && styles.buttonDisabled
                        ]}
                        disabled={!tipEnabled}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="language" size={compact ? 14 : 18} color={tipEnabled ? '#64B5F6' : '#888'} />
                        <Text style={[styles.tipText, compact && styles.textCompact, !tipEnabled && styles.textDisabled]}>
                            Tip
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Hint Button - Reveals word */}
            <Animated.View style={{ transform: [{ scale: hintPulse }] }}>
                <TouchableOpacity
                    onPress={onHint}
                    style={[
                        styles.hintButton,
                        compact && styles.buttonCompact,
                        !hintEnabled && styles.buttonDisabled
                    ]}
                    disabled={!hintEnabled}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Icon name="bulb" size={compact ? 14 : 18} color={hintEnabled ? '#FFC107' : '#888'} />
                    <Text style={[styles.hintText, compact && styles.textCompact, !hintEnabled && styles.textDisabled]}>
                        Hint
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    containerCompact: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 6,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    statBadgeCompact: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 3,
    },
    progressBadge: {
        position: 'relative',
        overflow: 'hidden',
    },
    progressBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    statText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    statTextCompact: {
        fontSize: 12,
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 193, 7, 0.4)',
    },
    tipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(100, 181, 246, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(100, 181, 246, 0.4)',
    },
    buttonCompact: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 2,
    },
    buttonDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    hintText: {
        color: '#FFC107',
        fontWeight: '600',
        fontSize: 14,
    },
    tipText: {
        color: '#64B5F6',
        fontWeight: '600',
        fontSize: 14,
    },
    textCompact: {
        fontSize: 11,
    },
    textDisabled: {
        color: '#888',
    },
});
