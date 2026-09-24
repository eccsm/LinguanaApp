import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import Haptics from '../utils/haptics';

const { width } = Dimensions.get('window');

const TIER_CONFIG = {
    bronze: { name: 'Bronze', icon: '🥉', colors: ['#CD7F32', '#8B4513'] },
    silver: { name: 'Silver', icon: '🥈', colors: ['#C0C0C0', '#808080'] },
    gold: { name: 'Gold', icon: '🥇', colors: ['#FFD700', '#FFA500'] },
    diamond: { name: 'Diamond', icon: '💎', colors: ['#B9F2FF', '#00CED1'] },
    master: { name: 'Master', icon: '👑', colors: ['#9B59B6', '#6A0DAD'] },
};

/**
 * Modal shown when user is promoted or demoted between league tiers
 */
const LeaguePromotionModal = ({
    visible,
    onClose,
    previousTier,
    newTier,
    isPromotion = true
}) => {
    const { colors, isDarkMode } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;

    const tierConfig = TIER_CONFIG[newTier] || TIER_CONFIG.bronze;
    const prevTierConfig = TIER_CONFIG[previousTier] || TIER_CONFIG.bronze;

    useEffect(() => {
        if (visible) {
            // Entrance animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]).start();

            // Bounce animation for badge
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Haptics.success();
        } else {
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
        }
    }, [visible]);

    const handleClose = () => {
        Haptics.light();
        onClose();
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                            transform: [{ scale: scaleAnim }]
                        },
                    ]}
                >
                    {/* Header */}
                    <Text style={[styles.header, { color: colors.text }]}>
                        {isPromotion ? '🎉 Promoted!' : '📉 League Changed'}
                    </Text>

                    {/* Tier transition */}
                    <View style={styles.tierTransition}>
                        <View style={styles.tierBadgeSmall}>
                            <Text style={styles.tierIconSmall}>{prevTierConfig.icon}</Text>
                            <Text style={[styles.tierNameSmall, { color: colors.textSecondary }]}>
                                {prevTierConfig.name}
                            </Text>
                        </View>

                        <Text style={[styles.arrow, { color: isPromotion ? '#10B981' : '#EF4444' }]}>
                            {isPromotion ? '→' : '↓'}
                        </Text>

                        <Animated.View
                            style={[
                                styles.tierBadgeLarge,
                                { transform: [{ scale: bounceAnim }] }
                            ]}
                        >
                            <LinearGradient
                                colors={tierConfig.colors}
                                style={styles.tierGradient}
                            >
                                <Animated.Text
                                    style={[
                                        styles.tierIconLarge,
                                        { transform: [{ rotate }] }
                                    ]}
                                >
                                    {tierConfig.icon}
                                </Animated.Text>
                            </LinearGradient>
                            <Text style={[styles.tierNameLarge, { color: colors.text }]}>
                                {tierConfig.name} League
                            </Text>
                        </Animated.View>
                    </View>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {isPromotion
                            ? `Congratulations! You've been promoted to ${tierConfig.name} League!`
                            : `You've moved to ${tierConfig.name} League. Keep playing to climb back up!`
                        }
                    </Text>

                    {/* Continue button */}
                    <TouchableOpacity onPress={handleClose} style={styles.button}>
                        <LinearGradient
                            colors={isPromotion ? ['#10B981', '#059669'] : ['#6366F1', '#4F46E5']}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>Continue</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width - 40,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 24,
    },
    tierTransition: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    tierBadgeSmall: {
        alignItems: 'center',
        opacity: 0.6,
    },
    tierIconSmall: {
        fontSize: 32,
        marginBottom: 4,
    },
    tierNameSmall: {
        fontSize: 12,
        fontWeight: '600',
    },
    arrow: {
        fontSize: 32,
        fontWeight: 'bold',
        marginHorizontal: 20,
    },
    tierBadgeLarge: {
        alignItems: 'center',
    },
    tierGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    tierIconLarge: {
        fontSize: 48,
    },
    tierNameLarge: {
        fontSize: 18,
        fontWeight: '700',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default LeaguePromotionModal;
