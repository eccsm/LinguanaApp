/**
 * Animated Components Library
 * Reusable animated components with modern micro-interactions
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet } from 'react-native';
import Haptics from '../utils/haptics';

/**
 * Animated Button with Scale Effect
 * Scales down on press, provides haptic feedback
 */
export const AnimatedButton = ({ 
  children, 
  onPress, 
  style, 
  hapticType = 'light',
  scaleValue = 0.95,
  disabled = false,
  ...props 
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (hapticType && Haptics[hapticType]) {
      Haptics[hapticType]();
    }
    
    // Scale down animation
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    // Scale back up animation
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Fade In Animation
 * Fades in element on mount
 */
export const FadeInView = ({ 
  children, 
  duration = 500, 
  delay = 0, 
  style 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Slide In From Bottom Animation
 */
export const SlideInFromBottom = ({ 
  children, 
  duration = 400, 
  delay = 0, 
  style 
}) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Slide In From Left Animation
 */
export const SlideInFromLeft = ({ 
  children, 
  duration = 400, 
  delay = 0, 
  style 
}) => {
  const translateX = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateX }], opacity }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Scale In Animation
 * Pops in with scale effect
 */
export const ScaleIn = ({ 
  children, 
  duration = 400, 
  delay = 0, 
  style 
}) => {
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Bounce Animation
 * Continuous subtle bounce for attention
 */
export const BounceView = ({ 
  children, 
  style,
  enabled = true 
}) => {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [enabled]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Shake Animation
 * Shake for errors or attention
 */
export const ShakeView = ({ 
  children, 
  style,
  trigger = 0 // Increment to trigger shake
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === 0) return;

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Haptic feedback for shake
    Haptics.error();
  }, [trigger]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: shakeAnim }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Pulse Animation
 * Gentle pulse for highlights
 */
export const PulseView = ({ 
  children, 
  style,
  enabled = true 
}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!enabled) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [enabled]);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulse }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Shimmer Loading Effect (Skeleton)
 */
export const ShimmerView = ({ width, height, style, borderRadius = 8 }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmerGradient,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default {
  AnimatedButton,
  FadeInView,
  SlideInFromBottom,
  SlideInFromLeft,
  ScaleIn,
  BounceView,
  ShakeView,
  PulseView,
  ShimmerView,
};
