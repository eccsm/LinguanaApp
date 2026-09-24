import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWalkthrough, WALKTHROUGH_STEPS } from '../contexts/WalkthroughContext';
import { useTheme } from '../contexts/ThemeContext';
import Haptics from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPOTLIGHT_PADDING = 12; // Extra padding around spotlight
const TOOLTIP_WIDTH = SCREEN_WIDTH * 0.85;
const TOOLTIP_MAX_WIDTH = 340;

const WalkthroughOverlay = () => {
    const {
        isWalkthroughActive,
        currentStep,
        currentStepIndex,
        totalSteps,
        nextStep,
        completeWalkthrough,
        currentTargetMeasurement,
    } = useWalkthrough();

    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isWalkthroughActive) {
            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Pulse animation for spotlight ring
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [isWalkthroughActive]);

    // Animate tooltip on step change
    useEffect(() => {
        if (isWalkthroughActive) {
            tooltipAnim.setValue(0);
            Animated.spring(tooltipAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    }, [currentStepIndex, isWalkthroughActive]);

    const handleNext = () => {
        Haptics.light();

        // Animate out, then next
        Animated.timing(tooltipAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            nextStep();
        });
    };

    const handleSkip = () => {
        Haptics.light();
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            completeWalkthrough();
        });
    };

    if (!isWalkthroughActive) return null;

    const isLastStep = currentStepIndex === totalSteps - 1;
    const isCenteredStep = !currentStep?.targetKey;
    const hasMeasurement = currentTargetMeasurement && currentTargetMeasurement.width > 0;

    // Helper to get adjusted measurement for cutout
    const getAdjustedMeasurement = () => {
        if (!hasMeasurement) return null;
        return {
            x: currentTargetMeasurement.x - SPOTLIGHT_PADDING + (currentStep.xOffset || 0),
            y: currentTargetMeasurement.y - SPOTLIGHT_PADDING + (currentStep.yOffset || 0),
            width: currentTargetMeasurement.width + (SPOTLIGHT_PADDING * 2) + (currentStep.widthAdded || 0),
            height: currentTargetMeasurement.height + (SPOTLIGHT_PADDING * 2) + (currentStep.heightAdded || 0),
        };
    };

    const adjustedTarget = getAdjustedMeasurement();

    // Calculate spotlight position
    const spotlightStyle = adjustedTarget ? {
        left: adjustedTarget.x,
        top: adjustedTarget.y,
        width: adjustedTarget.width,
        height: adjustedTarget.height,
        borderRadius: 16,
    } : null;

    // Calculate tooltip position with smart bounds checking
    const getTooltipPosition = () => {
        if (isCenteredStep || !adjustedTarget) {
            // Centered modal
            return {
                left: (SCREEN_WIDTH - Math.min(TOOLTIP_WIDTH, TOOLTIP_MAX_WIDTH)) / 2,
                top: SCREEN_HEIGHT / 2 - 120,
                effectivePosition: 'center'
            };
        }

        const targetCenterX = adjustedTarget.x + (adjustedTarget.width / 2);
        const tooltipWidth = Math.min(TOOLTIP_WIDTH, TOOLTIP_MAX_WIDTH);
        const tooltipLeft = Math.max(20, Math.min(
            targetCenterX - (tooltipWidth / 2),
            SCREEN_WIDTH - tooltipWidth - 20
        ));

        // Estimate tooltip height + spacing
        const ESTIMATED_TOOLTIP_HEIGHT = 220;
        const SPACING = 20;
        const safeTop = Platform.OS === 'ios' ? 60 : 40;
        const safeBottom = SCREEN_HEIGHT - 40;

        let top = 0;
        let position = currentStep.position;

        // Calculate initial preferred position
        if (position === 'top') {
            top = adjustedTarget.y - ESTIMATED_TOOLTIP_HEIGHT;
        } else {
            top = adjustedTarget.y + adjustedTarget.height + SPACING;
        }

        // Check bounds and flip if needed
        if (position === 'top' && top < safeTop) {
            // Too high, flip to bottom
            top = adjustedTarget.y + adjustedTarget.height + SPACING;
            position = 'bottom';
        } else if (position === 'bottom' && (top + ESTIMATED_TOOLTIP_HEIGHT) > safeBottom) {
            // Too low, flip to top
            top = adjustedTarget.y - ESTIMATED_TOOLTIP_HEIGHT;
            position = 'top';
        }

        // Final clamp to ensure it's strictly on screen
        top = Math.max(safeTop, Math.min(top, safeBottom - ESTIMATED_TOOLTIP_HEIGHT));

        return { left: tooltipLeft, top, effectivePosition: position };
    };

    const { left, top, effectivePosition } = getTooltipPosition();

    return (
        <Animated.View
            style={[styles.overlay, { opacity: fadeAnim }]}
            pointerEvents="box-none"
        >
            {/* Backdrop with Cutout (Huge Border Approach) */}
            {!adjustedTarget ? (
                // Full backdrop if no target
                <TouchableWithoutFeedback onPress={handleSkip}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            ) : (
                // Cutout backdrop
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* The Huge Border View - Creates the rounded cutout visual */}
                    <View
                        style={{
                            position: 'absolute',
                            left: adjustedTarget.x - 2000, // Offset by border width
                            top: adjustedTarget.y - 2000, // Offset by border width
                            width: adjustedTarget.width + 4000, // Target width + 2 * border width
                            height: adjustedTarget.height + 4000, // Target height + 2 * border width
                            borderRadius: (currentStep.borderRadius || 16) + 2000, // Inner radius + border width
                            borderWidth: 2000,
                            borderColor: 'rgba(0, 0, 0, 0.8)',
                            backgroundColor: 'transparent',
                        }}
                        pointerEvents="none"
                    />

                    {/* Touch Handlers removed to allow manual scrolling */}
                    {/* The visual backdrop is handled by the border view above with pointerEvents="none" */}

                    {/* Spotlight Border (Pulsing Ring) */}
                    <Animated.View
                        style={[
                            styles.spotlight,
                            spotlightStyle,
                            {
                                borderRadius: currentStep.borderRadius || 16,
                                transform: [{ scale: pulseAnim }]
                            }
                        ]}
                        pointerEvents="none"
                    />
                </View>
            )}

            {/* Tooltip Card */}
            <Animated.View
                style={[
                    styles.tooltip,
                    {
                        backgroundColor: colors.card || '#1a1a2e',
                        left: left,
                        top: top,
                        width: Math.min(TOOLTIP_WIDTH, TOOLTIP_MAX_WIDTH),
                        transform: [
                            { scale: tooltipAnim },
                            {
                                translateY: tooltipAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                })
                            }
                        ],
                        opacity: tooltipAnim,
                    }
                ]}
            >
                {/* Step icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Icon
                            name={currentStep?.icon || 'star'}
                            size={28}
                            color="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Step indicator */}
                <View style={styles.stepIndicator}>
                    {WALKTHROUGH_STEPS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.stepDot,
                                index === currentStepIndex && styles.stepDotActive,
                                index < currentStepIndex && styles.stepDotComplete,
                            ]}
                        />
                    ))}
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text || '#FFFFFF' }]}>
                    {currentStep?.title}
                </Text>

                {/* Description */}
                <Text style={[styles.description, { color: colors.textSecondary || '#A0A0A0' }]}>
                    {currentStep?.description}
                </Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    {!isLastStep && (
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.nextButton, isLastStep && styles.nextButtonFull]}
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.nextText}>
                            {isLastStep ? "Let's Go!" : 'Next'}
                        </Text>
                        {!isLastStep && (
                            <Icon name="arrow-right" size={18} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Arrow pointing to target */}
                {hasMeasurement && effectivePosition === 'bottom' && (
                    <View style={[styles.arrow, styles.arrowUp]} />
                )}
                {hasMeasurement && effectivePosition === 'top' && (
                    <View style={[styles.arrow, styles.arrowDown]} />
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    backdropBlock: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    spotlight: {
        position: 'absolute',
        borderWidth: 3,
        borderColor: '#8a46ff',
        backgroundColor: 'transparent',
        shadowColor: '#8a46ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    tooltip: {
        position: 'absolute',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#8a46ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#8a46ff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8a46ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
        gap: 6,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    stepDotActive: {
        width: 20,
        backgroundColor: '#8a46ff',
    },
    stepDotComplete: {
        backgroundColor: '#10B981',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '600',
    },
    nextButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#8a46ff',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    arrow: {
        position: 'absolute',
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        alignSelf: 'center',
    },
    arrowUp: {
        top: -10,
        left: '50%',
        marginLeft: -12,
        borderBottomWidth: 12,
        borderBottomColor: '#1a1a2e',
    },
    arrowDown: {
        bottom: -10,
        left: '50%',
        marginLeft: -12,
        borderTopWidth: 12,
        borderTopColor: '#1a1a2e',
    },
});

export default WalkthroughOverlay;
