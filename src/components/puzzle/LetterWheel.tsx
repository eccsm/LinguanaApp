/**
 * LetterWheel Component
 * Circular letter arrangement with swipe-to-select functionality
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLetterSelection } from '../../hooks/useLetterSelection';

// ============================================================================
// Types
// ============================================================================

interface LetterWheelProps {
    /** Available letters for word formation */
    letters: string[];
    /** Currently selected letter indices */
    selectedIndices: number[];
    /** Callback when a letter is selected/deselected */
    onSelectLetter: (index: number) => void;
    /** Callback when the selection gesture ends (submit) */
    onSubmit: () => void;
    /** Callback when shuffle button is pressed */
    onShuffle?: () => void;
    /** Whether the wheel is enabled for interaction */
    enabled?: boolean;
    /** Compact mode for very small screens */
    compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const COMPACT_LETTER_SIZE = 36; // For very compact mode
const DEFAULT_LETTER_SIZE = 54; // Increased from 48
const MEDIUM_LETTER_SIZE = 48; // Increased from 42
const SMALL_LETTER_SIZE = 42; // Increased from 34

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate position for a letter in the circular layout
 */
function getLetterPosition(index: number, total: number, wheelSize: number, letterSize: number, radiusMultiplier: number = 1.0) {
    const angleOffset = -Math.PI / 2; // Start from top
    const angle = angleOffset + (2 * Math.PI * index) / total;
    // Spread letters based on radiusMultiplier - smaller value = closer to center
    const baseRadius = (wheelSize - letterSize * 1.2) / 2;
    const radius = baseRadius * radiusMultiplier;

    return {
        x: wheelSize / 2 + Math.cos(angle) * radius - letterSize / 2,
        y: wheelSize / 2 + Math.sin(angle) * radius - letterSize / 2,
    };
}

// ============================================================================
// Component
// ============================================================================

export default function LetterWheel({
    letters,
    selectedIndices,
    onSelectLetter,
    onSubmit,
    onShuffle,
    enabled = true,
    compact = false,
}: LetterWheelProps) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Calculate responsive letter size based on screen height and compact mode
    const letterSize = useMemo(() => {
        if (compact) return COMPACT_LETTER_SIZE;  // Very compact for small screens
        if (screenHeight < 700) return SMALL_LETTER_SIZE;
        if (screenHeight < 800) return MEDIUM_LETTER_SIZE;
        return DEFAULT_LETTER_SIZE;
    }, [screenHeight, compact]);

    // Calculate hit radius based on letter size and screen size
    // Smaller screens need tighter hit radius to prevent overlap
    const hitRadius = useMemo(() => {
        const baseRadius = letterSize / 2;
        if (screenHeight < 700) return baseRadius + 6; // Tight radius for small screens
        if (screenHeight < 800) return baseRadius + 10;
        return baseRadius + 14;
    }, [letterSize, screenHeight]);

    // Calculate wheel size based on both screen width and height
    // Compact mode uses even smaller wheel
    const wheelSize = useMemo(() => {
        if (compact) {
            // Very compact mode - prioritize fitting on screen
            const maxSize = 170;
            return Math.min(screenWidth * 0.5, maxSize);
        }
        // Max wheel size based on screen height - increased for better visibility
        const maxSize = screenHeight < 700 ? 200 : screenHeight < 800 ? 240 : 280;
        // Use the smaller of width-based or height-based sizing
        return Math.min(screenWidth * 0.6, maxSize);
    }, [screenWidth, screenHeight, compact]);

    // Detect tablet/large screen - bring letters closer to center
    const isLargeScreen = screenWidth >= 600;

    // Radius multiplier: controls letter spread from center
    // Higher value = letters spread further toward edge
    const radiusMultiplier = useMemo(() => {
        if (isLargeScreen) return 0.95; // Tablets: letters near edge
        return 0.92; // Phones: spread out more for better touch
    }, [isLargeScreen]);

    // Calculate center positions for hit detection
    const letterPositions = useMemo(() => {
        return letters.map((_, index) => {
            const pos = getLetterPosition(index, letters.length, wheelSize, letterSize, radiusMultiplier);
            return {
                x: pos.x + letterSize / 2,
                y: pos.y + letterSize / 2,
            };
        });
    }, [letters.length, wheelSize, letterSize, radiusMultiplier]);

    // Use the letter selection hook
    const { panResponder } = useLetterSelection({
        letters,
        letterPositions,
        hitRadius,
        onSelectLetter,
        onSubmit,
        enabled,
    });

    // Render connection lines between selected letters
    const renderLines = useCallback(() => {
        if (selectedIndices.length < 2) return null;

        return selectedIndices.slice(0, -1).map((startIdx, i) => {
            const endIdx = selectedIndices[i + 1];
            const startPos = letterPositions[startIdx];
            const endPos = letterPositions[endIdx];

            if (!startPos || !endPos) return null;

            const dx = endPos.x - startPos.x;
            const dy = endPos.y - startPos.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
                <View
                    key={`line-${i}`}
                    style={[
                        styles.connectionLine,
                        {
                            width: length,
                            left: (startPos.x + endPos.x) / 2 - length / 2,
                            top: (startPos.y + endPos.y) / 2 - 3,
                            transform: [{ rotate: `${angle}deg` }],
                        },
                    ]}
                />
            );
        });
    }, [selectedIndices, letterPositions]);

    // Calculate padding - smaller on small screens
    const containerPadding = screenHeight < 700 ? 0 : screenHeight < 800 ? 2 : 6;

    return (
        <View style={[styles.container, { paddingVertical: containerPadding }]}>
            {/* Background circle - matches wheel size exactly */}
            <View style={[styles.wheelBackground, { width: wheelSize, height: wheelSize }]}>
                <View style={[styles.wheel, { width: wheelSize, height: wheelSize }]}>
                    {/* Connection Lines (bottom layer) */}
                    {renderLines()}

                    {/* Letter Bubbles (middle layer) */}
                    {letters.map((letter, index) => {
                        const pos = getLetterPosition(index, letters.length, wheelSize, letterSize, radiusMultiplier);
                        const isSelected = selectedIndices.includes(index);

                        return (
                            <View
                                key={`letter-${index}`}
                                pointerEvents="none"
                                style={[
                                    styles.letterBubble,
                                    {
                                        left: pos.x,
                                        top: pos.y,
                                        width: letterSize,
                                        height: letterSize,
                                        borderRadius: letterSize / 2,
                                    },
                                    isSelected && styles.letterSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.letterText,
                                        isSelected && styles.letterTextSelected,
                                    ]}
                                    allowFontScaling={false}
                                >
                                    {letter}
                                </Text>
                            </View>
                        );
                    })}

                    {/* Touch capture layer */}
                    <View
                        style={[StyleSheet.absoluteFill, styles.touchLayer]}
                        pointerEvents="box-only"
                        {...panResponder.panHandlers}
                    />

                    {/* Center Shuffle Button - hidden when letters are selected */}
                    {onShuffle && selectedIndices.length === 0 && (() => {
                        const buttonSize = screenHeight < 700 ? 40 : screenHeight < 800 ? 48 : 56;
                        const iconSize = screenHeight < 700 ? 20 : screenHeight < 800 ? 24 : 28;
                        return (
                            <TouchableOpacity
                                style={[styles.shuffleButton, {
                                    width: buttonSize,
                                    height: buttonSize,
                                    borderRadius: buttonSize / 2,
                                    left: wheelSize / 2 - buttonSize / 2,
                                    top: wheelSize / 2 - buttonSize / 2,
                                }]}
                                onPress={onShuffle}
                                activeOpacity={0.7}
                            >
                                <Icon name="shuffle-variant" size={iconSize} color="#2E5A8B" />
                            </TouchableOpacity>
                        );
                    })()}
                </View>
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    wheelFrame: {
        // Outer decorative frame with shadow
        borderRadius: 1000,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    wheelBackground: {
        // Inner scenic gradient circle
        borderRadius: 1000,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    wheel: {
        position: 'relative',
    },
    letterBubble: {
        position: 'absolute',
        // width, height, borderRadius are set dynamically via inline styles
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    letterSelected: {
        backgroundColor: 'rgba(255, 218, 5, 0.9)',
        transform: [{ scale: 1.15 }],
    },
    letterText: {
        fontSize: 30, // Increased from 26
        fontWeight: 'bold',
        color: '#2E5A8B',
    },
    letterTextSelected: {
        color: '#1a3a5c',
    },
    selectionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    selectionBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    connectionLine: {
        position: 'absolute',
        height: 6,
        backgroundColor: 'rgba(255,215,0,0.6)',
        borderRadius: 3,
        zIndex: 5,
    },
    shuffleButton: {
        position: 'absolute',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100,
    },
    touchLayer: {
        zIndex: 1000,
        backgroundColor: 'transparent',
    },
});
