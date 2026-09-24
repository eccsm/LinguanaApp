import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Platform
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

const { width, height } = Dimensions.get('window');

const NoInternetModal = () => {
    const [isConnected, setIsConnected] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const scaleAnim = useState(new Animated.Value(0.9))[0];
    const opacityAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            // Only show if explicitly false (not null/unknown initially)
            const offline = state.isConnected === false;
            if (offline !== !isConnected) {
                setIsConnected(!offline);
                if (offline) {
                    setShowModal(true);
                    animateIn();
                } else {
                    animateOut();
                }
            }
        });

        return () => unsubscribe();
    }, [isConnected]);

    const animateIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateOut = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => setShowModal(false));
    };

    const handleRetry = useCallback(() => {
        NetInfo.fetch().then(state => {
            if (state.isConnected) {
                setIsConnected(true);
                animateOut();
            }
        });
    }, []);

    if (!showModal) return null;

    return (
        <Modal
            visible={showModal}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Background Blur/Dim */}
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
                    {Platform.OS === 'ios' ? (
                        <BlurView
                            style={StyleSheet.absoluteFill}
                            blurType="dark"
                            blurAmount={10}
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
                    )}
                </Animated.View>

                {/* Modal Content */}
                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#2A2A35', '#1F1F28']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        {/* Icon Circle */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#FF512F', '#DD2476']}
                                style={styles.iconGradient}
                            >
                                <Icon name="wifi-off" size={40} color="#FFF" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>No Internet Connection</Text>
                        <Text style={styles.message}>
                            It looks like you're offline. Please check your internet settings to continue learning.
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleRetry}
                            style={styles.button}
                        >
                            <LinearGradient
                                colors={['#6A11CB', '#2575FC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>Try Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    contentContainer: {
        width: width * 0.85,
        maxWidth: 340,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: '#FF512F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6A11CB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default NoInternetModal;
