import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ComboMeter = ({ combo, multiplier }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;

    // Animate when combo increases
    useEffect(() => {
        if (combo > 0) {
            // Pop effect
            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.5,
                    friction: 3,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 3,
                    useNativeDriver: true,
                }),
            ]).start();

            // Shake effect for high combos
            if (combo >= 5) {
                Animated.sequence([
                    Animated.timing(rotation, { toValue: -5, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: 5, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: -5, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]).start();
            }

            // Progress bar fill
            Animated.spring(progress, {
                toValue: Math.min(combo / 10, 1),
                useNativeDriver: false, // width doesn't support native driver
            }).start();
        } else {
            // Reset
            Animated.timing(progress, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    }, [combo]);

    const rotateStr = rotation.interpolate({
        inputRange: [-5, 5],
        outputRange: ['-5deg', '5deg'],
    });

    const progressColor = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#3B82F6', '#F59E0B', '#EF4444'], // Blue -> Orange -> Red
    });

    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    if (combo < 2) return null;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.badge, { transform: [{ scale }, { rotate: rotateStr }] }]}>
                <LinearGradient
                    colors={combo >= 10 ? ['#EF4444', '#B91C1C'] : combo >= 5 ? ['#F59E0B', '#D97706'] : ['#3B82F6', '#2563EB']}
                    style={styles.gradient}
                >
                    <Text style={styles.comboText}>{combo}x</Text>
                    <Text style={styles.label}>COMBO</Text>
                </LinearGradient>
            </Animated.View>

            {multiplier > 1 && (
                <Animated.Text style={[styles.multiplier, { transform: [{ scale }] }]}>
                    {multiplier.toFixed(1)}x Multiplier!
                </Animated.Text>
            )}

            <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: progressColor }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        marginBottom: 5,
    },
    gradient: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    comboText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 1,
    },
    multiplier: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginBottom: 5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    progressBarBg: {
        width: 120,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    }
});

export default ComboMeter;
