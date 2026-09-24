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

const { width } = Dimensions.get('window');

const AdContinueModal = ({
    visible,
    onContinue,
    onDecline,
    // Heart Refill props
    heartRefillCount = 0,
    onUseHeartRefill,
    onBuyHeartRefill,
    showAdOption = true,  // Whether to show Watch Ad option
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
        }
    }, [visible]);

    const hasHeartRefill = heartRefillCount > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDecline}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#FF6B6B', '#FF8E53']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalContent}
                    >
                        {/* Header Icon */}
                        <View style={styles.iconContainer}>
                            <Icon name="heart-dislike" size={60} color="#FFF" />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Out of Lives!</Text>

                        {/* Message */}
                        <Text style={styles.message}>
                            You've run out of lives, but don't give up!{'\n\n'}
                            {showAdOption && 'Watch a short ad to get '}
                            {showAdOption && <Text style={styles.highlight}>1 extra life</Text>}
                            {showAdOption && ', or '}
                            {hasHeartRefill ? (
                                <>use your <Text style={styles.highlightPurple}>Heart Refill</Text> for 3 lives!</>
                            ) : (
                                <>get a <Text style={styles.highlightPurple}>Heart Refill</Text> from the Shop!</>
                            )}
                        </Text>

                        {/* FAMILIES POLICY CONSENT NOTICE */}
                        {showAdOption && (
                            <Text style={styles.consentNotice}>
                                You can close the ad after 5 seconds, but you won't receive the reward if you close early.
                            </Text>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {/* Watch Ad Button */}
                            {showAdOption && (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={onContinue}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#45a049']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.continueButtonGradient}
                                    >
                                        <Icon name="play-circle" size={24} color="#FFF" style={styles.buttonIcon} />
                                        <View style={styles.buttonTextContainer}>
                                            <Text style={styles.continueButtonText}>Watch Ad & Continue</Text>
                                            <Text style={styles.buttonSubtext}>+1 Life</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Heart Refill Button - Use or Buy */}
                            {hasHeartRefill ? (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={onUseHeartRefill}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.continueButtonGradient}
                                    >
                                        <Icon name="heart" size={24} color="#FFF" style={styles.buttonIcon} />
                                        <View style={styles.buttonTextContainer}>
                                            <Text style={styles.continueButtonText}>Use Heart Refill</Text>
                                            <Text style={styles.buttonSubtext}>+3 Lives • {heartRefillCount} in inventory</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={onBuyHeartRefill}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#F59E0B', '#D97706']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.continueButtonGradient}
                                    >
                                        <Icon name="cart" size={24} color="#FFF" style={styles.buttonIcon} />
                                        <View style={styles.buttonTextContainer}>
                                            <Text style={styles.continueButtonText}>Buy Heart Refill</Text>
                                            <Text style={styles.buttonSubtext}>Get +3 Lives from Shop</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Decline Button */}
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={onDecline}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.declineButtonText}>No Thanks, End Game</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Info Text */}
                        <Text style={styles.infoText}>
                            {showAdOption ? 'Watch ad once per game • Heart Refill once per game' : 'Heart Refill once per game'}
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
        opacity: 0.95,
    },
    highlight: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#FFD93D',
    },
    highlightPurple: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#C4B5FD',
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 10,
    },
    continueButton: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },
    continueButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonTextContainer: {
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
    },
    declineButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginTop: 5,
    },
    declineButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 10,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // FAMILIES POLICY: Consent notice styling
    consentNotice: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        paddingVertical: 8,
        borderRadius: 8,
        fontStyle: 'italic',
    },
});

export default AdContinueModal;

