/**
 * Celebration Effects
 * Confetti, particles, and celebration animations
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Haptics from '../utils/haptics';

/**
 * Confetti Celebration
 * Fires confetti from bottom
 */
export const ConfettiCelebration = ({
  trigger = false,
  colors = ['#8a46ff', '#6e3ff0', '#FF6B6B', '#FFE66D', '#4ECDC4']
}) => {
  const confettiRef = useRef(null);

  useEffect(() => {
    if (trigger && confettiRef.current) {
      confettiRef.current.start();
      // Heavy haptic for celebration
      Haptics.heavy();
    }
  }, [trigger]);

  if (!trigger) return null;

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={150}
      origin={{ x: -10, y: 0 }}
      autoStart={false}
      fadeOut={true}
      colors={colors}
      explosionSpeed={350}
      fallSpeed={2000}
    />
  );
};

/**
 * Success Particle Burst
 * Animated particles that burst outward
 */
export const ParticleBurst = ({ trigger = 0, emoji = '⭐' }) => {
  const particles = useRef(
    Array.from({ length: 12 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0), // Start hidden
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (trigger === 0) return;

    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 60;

      // Reset values
      particle.x.setValue(0);
      particle.y.setValue(0);
      particle.opacity.setValue(1);
      particle.scale.setValue(1);

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * distance,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Medium haptic feedback
    Haptics.medium();
  }, [trigger]);

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      ))}
    </View>
  );
};

/**
 * Floating Hearts Animation
 * Hearts float up from bottom
 */
export const FloatingHearts = ({ trigger = 0 }) => {
  const hearts = useRef(
    Array.from({ length: 5 }).map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value((Math.random() - 0.5) * 100),
      opacity: new Animated.Value(0), // Start hidden
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  useEffect(() => {
    if (trigger === 0) return;

    hearts.forEach((heart, index) => {
      // Reset
      heart.y.setValue(0);
      heart.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(heart.y, {
          toValue: -200,
          duration: 2000 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(heart.opacity, {
          toValue: 0,
          duration: 2000 + index * 200,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });

    Haptics.success();
  }, [trigger]);

  return (
    <View style={styles.heartsContainer} pointerEvents="none">
      {hearts.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.heart,
            {
              transform: [
                { translateY: heart.y },
                { translateX: heart.x },
                { scale: heart.scale },
              ],
              opacity: heart.opacity,
            },
          ]}
        >
          ❤️
        </Animated.Text>
      ))}
    </View>
  );
};

/**
 * Star Rain Effect
 * Stars fall from top
 */
export const StarRain = ({ trigger = 0, duration = 3000 }) => {
  const stars = useRef(
    Array.from({ length: 20 }).map(() => ({
      y: new Animated.Value(-50),
      x: new Animated.Value(Math.random() * 400 - 200),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (trigger === 0) return;

    stars.forEach((star, index) => {
      // Reset
      star.y.setValue(-50);
      star.opacity.setValue(1);
      star.rotation.setValue(0);

      const delay = index * 100;

      Animated.parallel([
        Animated.timing(star.y, {
          toValue: 800,
          duration: duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(star.opacity, {
          toValue: 0,
          duration: duration,
          delay: delay + duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(star.rotation, {
          toValue: 360,
          duration: duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    Haptics.success();
  }, [trigger]);

  return (
    <View style={styles.starContainer} pointerEvents="none">
      {stars.map((star, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.star,
            {
              transform: [
                { translateY: star.y },
                { translateX: star.x },
                {
                  rotate: star.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: star.opacity,
            },
          ]}
        >
          ⭐
        </Animated.Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 20,
  },
  heartsContainer: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 0,
    height: 0,
  },
  heart: {
    position: 'absolute',
    fontSize: 24,
  },
  starContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 0,
    height: 0,
  },
  star: {
    position: 'absolute',
    fontSize: 20,
  },
});

export default {
  ConfettiCelebration,
  ParticleBurst,
  FloatingHearts,
  StarRain,
};
