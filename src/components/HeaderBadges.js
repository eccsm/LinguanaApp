import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGamification } from '../features/GamificationFeatures'; // Adjust path if needed
import { useApp } from '../contexts/AppContext'; // Adjust path if needed
import { useAlert } from '../contexts/AlertContext';
import Haptics from '../utils/haptics';

/**
 * GEM BADGE 💎
 * Behavior: Stable. "Pops" and flashes white when gem count changes.
 */
export const GemBadge = ({ onPress, style }) => {
  const { stats } = useGamification();
  // Safe fallback for stats
  const gems = stats?.gems || 0;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevGems = useRef(gems);

  // Trigger Animation on Gem Change
  useEffect(() => {
    if (prevGems.current !== gems) {
      // 1. Pop Effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)), // Bouncy
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.bounce,
        }),
      ]).start();

      // 2. Flash Effect
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic Feedback for earning/spending
      if (gems > prevGems.current) {
        Haptics.success(); // Heavier haptic for gain
      } else {
        Haptics.light(); // Lighter for spend
      }

      prevGems.current = gems;
    }
  }, [gems]);

  const handlePress = () => {
    Haptics.selection(); // Standard UI click
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <View style={[styles.badgeBase, styles.gemContainer]}>
        {/* 1. Invisible Sizer: Defines the component's stable size */}
        <View style={[styles.badgeContentWrapper, { opacity: 0 }]}>
          <Icon name="diamond-stone" size={20} color="#34D399" style={styles.icon} />
          <Text style={styles.gemText}>{gems}</Text>
        </View>

        {/* 2. Absolutely Positioned Animated Content */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.badgeContentWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Icon name="diamond-stone" size={20} color="#34D399" style={styles.icon} />
          <Text style={styles.gemText}>{gems}</Text>
        </Animated.View>

        {/* 3. Flash overlay on top */}
        <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} />
      </View>
    </TouchableOpacity>
  );
};

/**
 * STREAK BADGE 🔥
 * Behavior: "Alive". Gently pulses and shimmers if streak > 0.
 */
export const StreakBadge = ({ onPress, style }) => {
  const { currentStreak, userProfile } = useApp(); // Use context that has streak data
  const { showAlert } = useAlert();

  // Animation Refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const streakCount = currentStreak || 0;

  // Check for active wager
  const hasActiveWager = userProfile?.activeWager?.status === 'active';

  // Determine if active today
  const hasPracticedToday = () => {
    if (!userProfile?.lastActive) return false;
    // ... logic to check date ...
    // Simplified for UI demo:
    return true;
  };

  const isActive = streakCount > 0;
  const isAtRisk = isActive && !hasPracticedToday();

  // "Alive" Animation Loop
  useEffect(() => {
    if (isActive) {
      // 1. Heartbeat Pulse (Subtle)
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );

      // 2. Light Shimmer (Sweeping reflection)
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.delay(2000), // Wait a bit
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0, // Reset instantly
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      shimmer.start();

      return () => {
        pulse.stop();
        shimmer.stop();
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const handlePress = () => {
    Haptics.selection();
    if (onPress) {
      onPress();
    } else {
      // Default behavior if no onPress provided
      showAlert(
        isActive ? 'Streak Active!' : 'Streak Inactive',
        isActive
          ? `You are on a ${streakCount}-day roll! Keep it up!`
          : 'Complete a lesson today to start your streak!',
        [{ text: 'OK' }]
      );
    }
  };

  // Interpolate Shimmer
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 100], // Sweeps across the badge
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={isActive ? ['#FF9966', '#FF5E62'] : ['#E5E7EB', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badgeBase, styles.streakContainer]}
        >
          {/* Shimmer Effect */}
          {isActive && (
            <View style={styles.shimmerMask}>
              <Animated.View
                style={[
                  styles.shimmerBar,
                  { transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }] }
                ]}
              />
            </View>
          )}

          <Icon name="fire" size={20} color={isActive ? "#FFF" : "#6B7280"} style={styles.icon} />
          <Text style={[styles.streakText, !isActive && styles.textInactive]}>
            {streakCount}
          </Text>
        </LinearGradient>

        {/* Active Wager Indicator - Moved outside to avoid clipping */}
        {hasActiveWager && (
          <View style={styles.wagerBadge}>
            <Icon name="diamond-stone" size={10} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * INVENTORY BADGE 🎒
 * Behavior: Stable. Shows backpack icon to access user inventory.
 */
export const InventoryBadge = ({ onPress, style }) => {
  const { stats } = useGamification();

  // Count total consumable items in inventory
  const inventoryItems = stats?.inventory || {};
  const consumableKeys = ['streakFreeze', 'heartRefill', 'nameChangeToken', 'xpPotion', 'streakRepair'];
  const totalItems = consumableKeys.reduce((sum, key) => sum + (inventoryItems[key] || 0), 0);

  // Animation Refs
  const popAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(totalItems);

  // Shimmer Loop
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  // Pop/Flash on count change
  useEffect(() => {
    if (prevCount.current !== totalItems) {
      // Pop
      Animated.sequence([
        Animated.timing(popAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(popAnim, { toValue: 1.0, duration: 200, useNativeDriver: true, easing: Easing.bounce }),
      ]).start();

      // Flash
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      prevCount.current = totalItems;
    }
  }, [totalItems]);

  const handlePress = () => {
    Haptics.selection();
    if (onPress) onPress();
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 100],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <Animated.View style={{ transform: [{ scale: popAnim }] }}>
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badgeBase, styles.inventoryContainer]}
        >
          {/* Shimmer Effect */}
          <View style={styles.shimmerMask}>
            <Animated.View
              style={[
                styles.shimmerBar,
                { transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }] }
              ]}
            />
          </View>

          {/* Flash Overlay */}
          <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} />

          <Icon name="bag-personal-outline" size={20} color="#FFF" />
          {/* Item count badge removed - cleaner look */}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};


/**
 * LEADERBOARD BADGE 🏆
 * Behavior: Shows global leaderboard.
 */
export const LeaderboardBadge = ({ onPress, style }) => {
  const handlePress = () => {
    Haptics.selection();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']} // Amber/Gold gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeBase, styles.inventoryContainer]} // Re-use container style
      >
        <Icon name="trophy-outline" size={20} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

/**
 * LEAGUE BADGE 🛡️
 * Behavior: Stable. Shows trophy icon to access league.
 */
export const LeagueBadge = ({ onPress, style }) => {
  const handlePress = () => {
    Haptics.selection();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB']} // Blue gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeBase, styles.inventoryContainer]} // Re-use container style
      >
        <Icon name="flag-checkered" size={20} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

/**
 * MAP BADGE 🗺️
 * Behavior: Stable. Shows map icon to access expedition.
 */
export const MapBadge = ({ onPress, style }) => {
  const handlePress = () => {
    Haptics.selection();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
      <LinearGradient
        colors={['#10B981', '#059669']} // Emerald/Green gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeBase, styles.inventoryContainer]} // Re-use container style
      >
        <Icon name="map-marker" size={20} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    height: 32,
    justifyContent: 'center',
    // Shared Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // GEM STYLES
  gemContainer: {
    backgroundColor: '#ECFDF5', // Very light emerald
    borderWidth: 1.5,
    borderColor: '#34D399', // Emerald 400
    overflow: 'hidden', // Contain the flash
    minWidth: 70, // A bit more space for gems
    paddingHorizontal: 12,
  },
  gemText: {
    fontWeight: '700',
    color: '#059669', // Darker Emerald Text
    fontSize: 15,
    fontVariant: ['tabular-nums'], // Keeps numbers aligned
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },

  // STREAK STYLES
  streakContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden', // Essential for shimmer
  },
  streakText: {
    fontWeight: '700',
    color: '#FFF',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontVariant: ['tabular-nums'],
  },
  textInactive: {
    color: '#374151',
    textShadowColor: 'transparent',
  },

  // COMMON
  icon: {
    marginRight: 5,
  },

  // SHIMMER
  shimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 20,
  },
  shimmerBar: {
    width: 30,
    height: '200%', // Taller than badge to cover diagonal skew
    backgroundColor: 'rgba(255,255,255,0.4)',
    position: 'absolute',
    top: -10,
    left: 0,
  },
  wagerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  // INVENTORY STYLES
  inventoryContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  inventoryCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  inventoryCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  badgeContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});