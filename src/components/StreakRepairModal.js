import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import Haptics from '../utils/haptics';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Logger from '../utils/logger';

const REPAIR_COST = 500;
const REPAIR_WINDOW_HOURS = 48; // Can repair within 48 hours

const StreakRepairModal = ({ visible, onClose, brokenStreak, onRepair, onAcceptDefeat }) => {
    const { colors, isDarkMode } = useTheme();
    const { stats } = useApp();
    const [loading, setLoading] = useState(false);
    const [shakeAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));

    const user = auth().currentUser;
    const userGems = stats?.gems || 0;
    const canAfford = userGems >= REPAIR_COST;

    // Shake animation on mount
    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();

            // Pulse animation for streak number
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();

            Haptics.heavy();
        }
    }, [visible]);

    const handleRepair = async () => {
        if (!canAfford || !user) return;

        setLoading(true);
        Haptics.medium();

        try {
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                gems: firestore.FieldValue.increment(-REPAIR_COST),
                currentStreak: brokenStreak,
                isStreakBroken: false,
                streakRepairedAt: firestore.FieldValue.serverTimestamp(),
            });

            Haptics.success();
            onRepair?.(brokenStreak);
            onClose();
        } catch (error) {
            Logger.error('[STREAK] Repair failed:', error);
            Haptics.error();
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptDefeat = async () => {
        if (!user) return;

        setLoading(true);
        Haptics.error();

        try {
            const userRef = firestore().collection('users').doc(user.uid);
            await userRef.update({
                currentStreak: 0,
                isStreakBroken: false,
            });

            onAcceptDefeat?.();
            onClose();
        } catch (error) {
            Logger.error('[STREAK] Accept defeat failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { backgroundColor: isDarkMode ? '#1F2937' : '#FFF', transform: [{ translateX: shakeAnim }] }
                    ]}
                >
                    {/* Broken heart icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.iconGradient}
                        >
                            <Icon name="heart-broken" size={48} color="#FFF" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Oh No! 💔
                    </Text>

                    {/* Description */}
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        You missed a day and broke your streak!
                    </Text>

                    {/* Streak counter */}
                    <Animated.View style={[styles.streakBadge, { transform: [{ scale: pulseAnim }] }]}>
                        <Icon name="fire" size={24} color="#FF6B35" />
                        <Text style={styles.streakNumber}>{brokenStreak}</Text>
                        <Text style={styles.streakLabel}>day streak</Text>
                    </Animated.View>

                    {/* Repair option */}
                    <TouchableOpacity
                        style={[
                            styles.repairButton,
                            !canAfford && styles.repairButtonDisabled,
                        ]}
                        onPress={handleRepair}
                        disabled={!canAfford || loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={canAfford ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.repairGradient}
                        >
                            <Icon name="wrench" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.repairText}>
                                Repair for {REPAIR_COST} 💎
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {!canAfford && (
                        <Text style={[styles.affordWarning, { color: '#EF4444' }]}>
                            You need {REPAIR_COST - userGems} more gems
                        </Text>
                    )}

                    {/* Accept defeat option */}
                    <TouchableOpacity
                        style={styles.defeatButton}
                        onPress={handleAcceptDefeat}
                        disabled={loading}
                    >
                        <Text style={[styles.defeatText, { color: colors.textSecondary }]}>
                            Accept Defeat (Reset to 0)
                        </Text>
                    </TouchableOpacity>

                    {/* Time warning */}
                    <View style={styles.timeWarning}>
                        <Icon name="clock-alert-outline" size={16} color="#F59E0B" />
                        <Text style={[styles.timeText, { color: '#F59E0B' }]}>
                            Offer expires in {REPAIR_WINDOW_HOURS}h
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '90%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FF6B35',
    },
    streakNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FF6B35',
        marginHorizontal: 8,
    },
    streakLabel: {
        fontSize: 16,
        color: '#FF6B35',
        fontWeight: '600',
    },
    repairButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
    },
    repairButtonDisabled: {
        opacity: 0.6,
    },
    repairGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    repairText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    affordWarning: {
        fontSize: 12,
        marginBottom: 16,
    },
    defeatButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 8,
    },
    defeatText: {
        fontSize: 14,
        fontWeight: '500',
    },
    timeWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default StreakRepairModal;
