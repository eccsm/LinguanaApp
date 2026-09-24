/**
 * PreAdConsentDialog - Google Play Families Policy Compliance
 * 
 * Shows a consent dialog BEFORE loading/showing any rewarded ad.
 * Required for Families Policy compliance on Google Play.
 * 
 * Message explains:
 * - User can close ad after 5 seconds
 * - Reward only granted if ad is watched completely
 * - User must explicitly consent before ad shows
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * Pre-ad consent dialog for Families Policy compliance
 * 
 * @param {boolean} visible - Whether dialog is visible
 * @param {function} onWatchAd - Called when user consents to watch ad
 * @param {function} onCancel - Called when user declines
 * @param {string} adType - Optional ad type for contextual messaging
 * @param {string} rewardDescription - Optional description of the reward (e.g., "+1 Extra Life")
 */
const PreAdConsentDialog = ({
    visible,
    onWatchAd,
    onCancel,
    adType = 'REWARD',
    rewardDescription = 'your reward',
}) => {
    const { colors, reducedMotion } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Use reduced motion for calm theme
            const animationConfig = reducedMotion
                ? { toValue: 1, duration: 150, useNativeDriver: true }
                : { toValue: 1, tension: 50, friction: 7, useNativeDriver: true };

            Animated.parallel([
                reducedMotion
                    ? Animated.timing(scaleAnim, animationConfig)
                    : Animated.spring(scaleAnim, animationConfig),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: reducedMotion ? 100 : 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
        }
    }, [visible, reducedMotion]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onCancel}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalContent}
                    >
                        {/* Header Icon */}
                        <View style={styles.iconContainer}>
                            <Icon name="play-circle" size={60} color="#FFF" />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Watch Video Ad?</Text>

                        {/* Consent Message - Required for Families Policy */}
                        <Text style={styles.message}>
                            Watch the complete video to earn {rewardDescription}.
                            {'\n\n'}
                            <Text style={styles.highlight}>
                                You can close the ad after 5 seconds
                            </Text>
                            , but you won't receive the reward if you close early.
                        </Text>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {/* Watch Ad Button - Primary Action */}
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={onWatchAd}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.primaryButtonGradient}
                                >
                                    <Icon name="play" size={24} color="#FFF" style={styles.buttonIcon} />
                                    <Text style={styles.primaryButtonText}>Watch Ad</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Cancel Button - Secondary Action */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info Text */}
                        <Text style={styles.infoText}>
                            Ads help keep this app free for everyone
                        </Text>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxWidth: 400,
    },
    modalContent: {
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.95,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#FFD93D',
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 10,
    },
    primaryButton: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonIcon: {
        marginRight: 10,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default PreAdConsentDialog;
