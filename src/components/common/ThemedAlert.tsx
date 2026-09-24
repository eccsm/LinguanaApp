/**
 * ThemedAlert - Custom themed modal replacement for Alert.alert
 * Supports light, dark, and cyberpunk themes with animations
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Removed static width - now using useWindowDimensions for responsiveness

// Alert type configurations
const ALERT_TYPES = {
    info: {
        icon: 'information',
        iconColor: '#3B82F6',
        gradientColors: ['#3B82F6', '#60A5FA'],
    },
    success: {
        icon: 'check-circle',
        iconColor: '#10B981',
        gradientColors: ['#10B981', '#34D399'],
    },
    warning: {
        icon: 'alert-circle',
        iconColor: '#F59E0B',
        gradientColors: ['#F59E0B', '#FBBF24'],
    },
    error: {
        icon: 'close-circle',
        iconColor: '#EF4444',
        gradientColors: ['#EF4444', '#F87171'],
    },
    question: {
        icon: 'help-circle',
        iconColor: '#8B5CF6',
        gradientColors: ['#8B5CF6', '#A78BFA'],
    },
};

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
    type?: 'info' | 'success' | 'warning' | 'error' | 'question';
    cancelable?: boolean;
}

interface ThemedAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    options?: AlertOptions;
    onDismiss: () => void;
}

const ThemedAlert: React.FC<ThemedAlertProps> = ({
    visible,
    title,
    message,
    buttons = [{ text: 'OK' }],
    options = {},
    onDismiss,
}) => {
    const { colors, activeTheme } = useTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const scaleValue = useRef(new Animated.Value(0.8)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    const alertType = options.type || 'info';
    const typeConfig = ALERT_TYPES[alertType] || ALERT_TYPES.info;
    const isCyberpunk = activeTheme === 'cyberpunk';

    // Responsive sizing
    const isSmallScreen = screenWidth < 360;
    const isVerySmallScreen = screenWidth < 320;

    useEffect(() => {
        if (visible) {
            scaleValue.setValue(0.8);
            opacityValue.setValue(0);

            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 8,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleButtonPress = (button: AlertButton) => {
        // Animate out
        Animated.parallel([
            Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
            if (button.onPress) {
                button.onPress();
            }
        });
    };

    const handleBackdropPress = () => {
        if (options.cancelable !== false) {
            // Find cancel button or just dismiss
            const cancelButton = buttons.find(b => b.style === 'cancel');
            if (cancelButton) {
                handleButtonPress(cancelButton);
            } else {
                handleButtonPress(buttons[0]);
            }
        }
    };

    if (!visible) return null;

    // Get cyberpunk glow color
    const glowColor = isCyberpunk ? colors.glowColor || '#ff2d95' : undefined;

    // Determine button layout - use vertical on small screens or 3+ buttons
    // Also check if button text is long (more than 10 chars)
    const hasLongButtonText = buttons.some(b => b.text.length > 10);
    const buttonLayout = (buttons.length > 2 || isSmallScreen || hasLongButtonText) ? 'vertical' : 'horizontal';

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={handleBackdropPress}
            statusBarTranslucent
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleBackdropPress}
            >
                {/* Backdrop */}
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: opacityValue,
                            backgroundColor: isCyberpunk
                                ? 'rgba(13, 2, 33, 0.85)'
                                : 'rgba(0, 0, 0, 0.5)',
                        },
                    ]}
                />

                {/* Modal Content */}
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.surface,
                            transform: [{ scale: scaleValue }],
                            opacity: opacityValue,
                            borderWidth: isCyberpunk ? 1 : 0,
                            borderColor: isCyberpunk ? glowColor : 'transparent',
                            // Responsive padding
                            padding: isSmallScreen ? 18 : 24,
                            maxWidth: isSmallScreen ? screenWidth - 40 : 340,
                            // Cyberpunk glow effect
                            ...(isCyberpunk && {
                                shadowColor: glowColor,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 15,
                            }),
                        },
                    ]}
                >
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconCircle,
                            {
                                backgroundColor: typeConfig.iconColor + '15',
                                borderColor: typeConfig.iconColor + '30',
                            },
                        ]}
                    >
                        <Icon
                            name={typeConfig.icon}
                            size={32}
                            color={typeConfig.iconColor}
                        />
                    </View>

                    {/* Title */}
                    <Text
                        style={[
                            styles.title,
                            {
                                color: colors.text,
                                ...(isCyberpunk && { textShadowColor: glowColor, textShadowRadius: 4 }),
                            },
                        ]}
                    >
                        {title}
                    </Text>

                    {/* Message */}
                    <Text
                        style={[
                            styles.message,
                            { color: colors.textSecondary },
                        ]}
                    >
                        {message}
                    </Text>

                    {/* Buttons */}
                    <View
                        style={[
                            styles.buttonContainer,
                            buttonLayout === 'horizontal' && styles.buttonContainerHorizontal,
                        ]}
                    >
                        {buttons.map((button, index) => {
                            const isDestructive = button.style === 'destructive';
                            const isCancel = button.style === 'cancel';
                            const isPrimary = !isCancel && !isDestructive && buttons.length > 1 && index === buttons.length - 1;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        buttonLayout === 'horizontal' && styles.buttonHorizontal,
                                        isPrimary && { backgroundColor: colors.primary },
                                        isDestructive && { backgroundColor: colors.error },
                                        isCancel && {
                                            backgroundColor: 'transparent',
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        },
                                        isCyberpunk && isPrimary && {
                                            shadowColor: glowColor,
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.6,
                                            shadowRadius: 8,
                                        },
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            { color: isPrimary || isDestructive ? '#FFF' : colors.text },
                                            isCancel && { color: colors.textSecondary },
                                            isSmallScreen && { fontSize: 14 },
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.8}
                                    >
                                        {button.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    buttonContainerHorizontal: {
        flexDirection: 'row',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonHorizontal: {
        flex: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ThemedAlert;
