/**
 * WordPreview Component
 * Displays the currently selected word with animation feedback
 * Responsive sizing based on screen height
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';

// ============================================================================
// Types
// ============================================================================

interface WordPreviewProps {
    /** Currently selected word */
    word: string;
    /** Result of last submit attempt for animation */
    lastResult?: 'success' | 'duplicate' | 'invalid' | null;
    /** Callback when animation completes */
    onAnimationComplete?: () => void;
    /** Compact mode for very small screens */
    compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function WordPreview({
    word,
    lastResult,
    onAnimationComplete,
    compact = false,
}: WordPreviewProps) {
    const { height: screenHeight } = useWindowDimensions();
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Responsive sizing based on screen height and compact mode
    const responsiveStyles = useMemo(() => {
        // Compact mode - very minimal sizing
        if (compact) {
            return {
                containerHeight: 36,
                minWidth: 70,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 14,
                fontSize: 14,
                letterSpacing: 2,
                marginBottom: 6,
            };
        }

        if (screenHeight < 700) {
            // Small screens - current settings
            return {
                containerHeight: 44,
                minWidth: 80,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 18,
                fontSize: 16,
                letterSpacing: 3,
                marginBottom: 12,
            };
        } else if (screenHeight < 850) {
            // Medium screens
            return {
                containerHeight: 56,
                minWidth: 100,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 22,
                fontSize: 22,
                letterSpacing: 3,
                marginBottom: 14,
            };
        } else {
            // Large screens
            return {
                containerHeight: 70,
                minWidth: 120,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 26,
                fontSize: 28,
                letterSpacing: 4,
                marginBottom: 16,
            };
        }
    }, [screenHeight, compact]);

    // Trigger animations based on result
    useEffect(() => {
        if (lastResult === 'invalid') {
            // Shake animation for invalid - fast shake (duplicate now handled by grid)
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 30, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 30, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 30, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
            ]).start(() => {
                onAnimationComplete?.();
            });
        } else if (lastResult === 'duplicate') {
            // Duplicate words now animate on the puzzle grid, just call complete
            onAnimationComplete?.();
        } else if (lastResult === 'success') {
            // Success animation - quick flash and scale
            flashAnim.setValue(1);
            scaleAnim.setValue(1.15);

            Animated.parallel([
                Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
            ]).start(() => {
                onAnimationComplete?.();
            });
        }
    }, [lastResult, shakeAnim, flashAnim, scaleAnim, onAnimationComplete]);

    const getBackgroundColor = () => {
        // Only show result colors if there's a word being displayed
        // After submission, word is cleared but lastResult may still be set
        if (!word) return 'rgba(255, 255, 255, 0.15)';

        if (lastResult === 'success') return 'rgba(76, 175, 80, 0.3)';
        if (lastResult === 'invalid') return 'rgba(244, 67, 54, 0.2)';
        if (lastResult === 'duplicate') return 'rgba(255, 152, 0, 0.2)';
        return 'rgba(255, 255, 255, 0.15)';
    };

    return (
        <View style={[
            styles.container,
            {
                height: responsiveStyles.containerHeight,
                marginBottom: responsiveStyles.marginBottom,
            }
        ]}>
            <Animated.View
                style={[
                    styles.previewBox,
                    {
                        backgroundColor: getBackgroundColor(),
                        minWidth: responsiveStyles.minWidth,
                        paddingHorizontal: responsiveStyles.paddingHorizontal,
                        paddingVertical: responsiveStyles.paddingVertical,
                        borderRadius: responsiveStyles.borderRadius,
                    },
                    {
                        transform: [
                            { translateX: shakeAnim },
                            { scale: scaleAnim },
                        ],
                    },
                ]}
            >
                <Text
                    style={[
                        styles.wordText,
                        {
                            fontSize: responsiveStyles.fontSize,
                            letterSpacing: responsiveStyles.letterSpacing,
                        }
                    ]}
                    numberOfLines={1}
                    allowFontScaling={false}
                >
                    {word || '\u00A0'} {/* Non-breaking space to maintain height */}
                </Text>

                {/* Success flash overlay */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.flashOverlay,
                        { opacity: flashAnim },
                    ]}
                    pointerEvents="none"
                />
            </Animated.View>
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
        paddingHorizontal: 16,
    },
    previewBox: {
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
    },
    wordText: {
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    flashOverlay: {
        backgroundColor: '#4CAF50',
        borderRadius: 25,
    },
    helperText: {
        position: 'absolute',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    },
});
