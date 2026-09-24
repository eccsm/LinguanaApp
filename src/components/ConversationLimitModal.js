import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const ConversationLimitModal = ({ visible, onClose, onNewChat, onUpgrade, messageCount = 15 }) => {
    const { colors } = useTheme();
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modal,
                        {
                            backgroundColor: colors.surface,
                            transform: [{ scale: scaleValue }]
                        }
                    ]}
                >
                    {/* Icon Header */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconCircle}
                        >
                            <Text style={styles.icon}>💬</Text>
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Conversation Complete! 🎉
                    </Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        You've sent {messageCount} messages in this conversation.{'\n'}
                        Start a new conversation to continue practicing!
                    </Text>

                    {/* Stats Badge */}
                    <View style={[styles.statsBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={styles.statsIcon}>📊</Text>
                        <View style={styles.statsTextContainer}>
                            <Text style={[styles.statsTitle, { color: colors.text }]}>
                                Great progress!
                            </Text>
                            <Text style={[styles.statsSubtext, { color: colors.textSecondary }]}>
                                You practiced {messageCount} conversational exchanges
                            </Text>
                        </View>
                    </View>

                    {/* Premium Benefits */}
                    <View style={styles.benefitsContainer}>
                        <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                            ⭐ Premium Benefits
                        </Text>
                        <BenefitItem icon="♾️" text="Unlimited messages per chat" colors={colors} />
                        <BenefitItem icon="💎" text="Unlimited daily conversations" colors={colors} />
                        <BenefitItem icon="🚀" text="Advanced GPT-4 model" colors={colors} />
                        <BenefitItem icon="🎙️" text="Voice practice features" colors={colors} />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonsContainer}>
                        {/* Upgrade Button */}
                        <TouchableOpacity
                            style={styles.upgradeButton}
                            onPress={onUpgrade}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#8a46ff', '#6A11CB']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.upgradeButtonGradient}
                            >
                                <Text style={styles.upgradeButtonIcon}>⭐</Text>
                                <View style={styles.upgradeButtonTextContainer}>
                                    <Text style={styles.upgradeButtonText}>
                                        Upgrade to Premium
                                    </Text>
                                    <Text style={styles.upgradeButtonSubtext}>
                                        Unlimited everything • $9.99/month
                                    </Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Secondary Buttons */}
                        <View style={styles.secondaryButtons}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { backgroundColor: colors.primary + '15' }]}
                                onPress={onNewChat}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryButtonIcon}>🏠</Text>
                                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                                    New Chat
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, { backgroundColor: colors.textSecondary + '15' }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryButtonIcon}>👋</Text>
                                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                                    Exit
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const BenefitItem = ({ icon, text, colors }) => (
    <View style={styles.benefitItem}>
        <Text style={styles.benefitIcon}>{icon}</Text>
        <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        width: width - 48,
        maxWidth: 420,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    icon: {
        fontSize: 36
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.3
    },
    message: {
        fontSize: 15,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500'
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 20
    },
    statsIcon: {
        fontSize: 28,
        marginRight: 12
    },
    statsTextContainer: {
        flex: 1
    },
    statsTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2
    },
    statsSubtext: {
        fontSize: 12,
        fontWeight: '500'
    },
    benefitsContainer: {
        width: '100%',
        marginBottom: 20,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(138, 70, 255, 0.2)',
        backgroundColor: 'rgba(138, 70, 255, 0.05)'
    },
    benefitsTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center'
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4
    },
    benefitIcon: {
        fontSize: 18,
        marginRight: 10,
        width: 24
    },
    benefitText: {
        fontSize: 14,
        flex: 1,
        fontWeight: '500'
    },
    buttonsContainer: {
        width: '100%'
    },
    upgradeButton: {
        width: '100%',
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8a46ff',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8
    },
    upgradeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20
    },
    upgradeButtonIcon: {
        fontSize: 24,
        marginRight: 12
    },
    upgradeButtonTextContainer: {
        flex: 1
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: 0.3
    },
    upgradeButtonSubtext: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.9
    },
    secondaryButtons: {
        flexDirection: 'row',
        gap: 10
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14
    },
    secondaryButtonIcon: {
        fontSize: 18,
        marginRight: 6
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '700'
    }
});

export default ConversationLimitModal;
