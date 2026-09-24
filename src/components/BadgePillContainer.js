import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    ScrollView as RNScrollView,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Haptics from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
// Note: GemBadge/StreakBadge not used in pill, simpler inline icons used for better scroll

// Constants
const COLLAPSED_WIDTH = 52; // Width when collapsed (icon + chevron)
const ANIMATION_DURATION = 300;

/**
 * ==========================================
 * BADGE PILL SYSTEM
 * ==========================================
 */


/**
 * LeaderboardBadge 🏆
 * Shows global ranking
 */
export const LeaderboardBadge = ({ onPress, style }) => {
    const handlePress = () => {
        Haptics.selection();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
            <View style={styles.miniBadge}>
                <Icon name="trophy-outline" size={20} color="#F59E0B" />
            </View>
        </TouchableOpacity>
    );
};

/**
 * LeagueBadge 🛡️
 * Shows current league status
 */
export const LeagueBadge = ({ onPress, style }) => {
    const handlePress = () => {
        Haptics.selection();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
            <View style={styles.miniBadge}>
                <Icon name="flag-checkered" size={20} color="#3B82F6" />
            </View>
        </TouchableOpacity>
    );
};

/**
 * MapBadge 🗺️
 * Shows expedition/journey progress
 */
export const MapBadge = ({ onPress, style }) => {
    const handlePress = () => {
        Haptics.selection();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
            <View style={styles.miniBadge}>
                <Icon name="map-marker" size={20} color="#10B981" />
            </View>
        </TouchableOpacity>
    );
};

/**
 * NewBadgePlaceholder ✨
 * Placeholder for future badges
 */
export const NewBadgePlaceholder = ({ onPress, style }) => {
    const handlePress = () => {
        Haptics.selection();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={style}>
            <View style={[styles.miniBadge, styles.placeholderBadge]}>
                <Icon name="plus" size={18} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );
};

/**
 * BadgePillContainer
 * Main expandable pill component
 */
export const BadgePillContainer = ({
    onInventoryPress,
    onLeaderboardPress,
    onTrophyPress,
    onMapPress,
    onNewPress,
    onGemPress,      // Navigate to Shop
    onStreakPress,   // Show streak modal
    onExpandChange,  // Callback when expanded state changes
    style,
    maxWidth: customMaxWidth, // Allow parent to set max width
}) => {
    const { colors, isDarkMode } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const [isExpanded, setIsExpanded] = useState(false);

    // Animation values - only for opacity and rotation (native driver compatible)
    const chevronRotation = useRef(new Animated.Value(0)).current;
    const badgeOpacity = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);

    // Track if animation is in progress to prevent double-triggering
    const isAnimatingRef = useRef(false);

    // Responsive: Show all badges directly on larger screens (tablets, landscape)
    // Threshold: 500px gives enough space for profile + all badges + gem/streak badges
    const isLargeScreen = screenWidth >= 500;

    // Calculate max width - can be wider since badges hide when expanded
    const isSmallScreen = screenWidth < 375;
    // Take up to 70% of screen width since badges will be hidden
    const calculatedMaxWidth = Math.min(screenWidth * 0.70, 280);
    const maxExpandedWidth = customMaxWidth || calculatedMaxWidth;

    const toggleExpand = useCallback(() => {
        // Prevent double-triggering while animating
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const toExpanded = !isExpanded;

        Haptics.selection();

        // Notify parent of expand state change
        if (onExpandChange) {
            onExpandChange(toExpanded);
        }

        // Reset scroll position immediately when collapsing
        if (!toExpanded && scrollRef.current) {
            scrollRef.current.scrollTo({ x: 0, animated: false });
        }

        // Stop any ongoing animations
        chevronRotation.stopAnimation();
        badgeOpacity.stopAnimation();

        if (toExpanded) {
            // EXPANDING
            // First update state, then animate
            setIsExpanded(true);

            Animated.parallel([
                Animated.timing(chevronRotation, {
                    toValue: 1,
                    duration: 250,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(badgeOpacity, {
                    toValue: 1,
                    duration: 200,
                    delay: 100, // Delay so badges fade in after width expands
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                isAnimatingRef.current = false;
            });
        } else {
            // COLLAPSING
            // First fade out badges, then collapse
            Animated.timing(badgeOpacity, {
                toValue: 0,
                duration: 100,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                // After fade completes, update state to collapse width
                setIsExpanded(false);

                Animated.timing(chevronRotation, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                }).start(() => {
                    isAnimatingRef.current = false;
                });
            });
        }
    }, [isExpanded, onExpandChange, chevronRotation, badgeOpacity]);

    // Interpolate chevron rotation
    const chevronRotate = chevronRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Get gradient colors from theme
    const gradientColors = colors.primaryGradient || ['#8a46ff', '#c34aff'];

    // SMALL SCREEN LAYOUT: Expandable pill
    // Using state-based width for smoother transitions
    const pillWidth = isExpanded ? maxExpandedWidth : COLLAPSED_WIDTH;

    return (
        <View style={[
            styles.pillContainer,
            style,
            { width: pillWidth }
        ]}>
            {/* Gradient Border Frame - More visible */}
            <LinearGradient
                colors={gradientColors}
                style={styles.gradientBorderFrame}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Inner Content Container (creates the border effect) */}
            <View style={styles.pillInnerContainer}>
                {/* Pearlescent Base Layer */}
                <LinearGradient
                    colors={isDarkMode
                        ? ['#1a1a2e', '#16213e', '#1a1a2e']
                        : ['#fdfbfb', '#ebedee', '#fdfbfb']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Pearl Shimmer Overlay - subtle iridescent effect */}
                <LinearGradient
                    colors={isDarkMode
                        ? ['rgba(139,92,246,0.15)', 'rgba(59,130,246,0.1)', 'rgba(236,72,153,0.15)']
                        : ['rgba(139,92,246,0.08)', 'rgba(59,130,246,0.05)', 'rgba(236,72,153,0.08)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                />

                {/* Highlight Shimmer - top-left glow */}
                <LinearGradient
                    colors={isDarkMode
                        ? ['rgba(255,255,255,0.08)', 'transparent']
                        : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />

                {/* Main Content */}
                <View style={styles.pillContent}>
                    {/* Toggle Button (Apps + Chevron) */}
                    <TouchableOpacity
                        onPress={toggleExpand}
                        style={styles.toggleButton}
                        activeOpacity={0.8}
                    >
                        <View style={styles.toggleInner}>
                            <Icon name="apps" size={18} color={colors.primary || '#8B5CF6'} />
                            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                                <Icon name="chevron-down" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ marginLeft: 2 }} />
                            </Animated.View>
                        </View>
                    </TouchableOpacity>

                    {/* Badges with FlatList - Always rendered, controlled by opacity */}
                    <Animated.View
                        style={[styles.badgesWrapper, { opacity: badgeOpacity }]}
                        pointerEvents={isExpanded ? 'auto' : 'none'}
                    >
                        <GHScrollView
                            ref={scrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            scrollEventThrottle={16}
                            bounces={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                            style={{ flex: 1 }}
                        >
                            {/* Inventory */}
                            <TouchableOpacity onPress={onInventoryPress} activeOpacity={0.7} style={styles.scrollBadge}>
                                <View style={[styles.miniBadge, isDarkMode && styles.miniBadgeDark]}>
                                    <Icon name="bag-personal" size={20} color="#8B5CF6" />
                                </View>
                            </TouchableOpacity>

                            {/* Leaderboard */}
                            <LeaderboardBadge onPress={onLeaderboardPress} style={styles.scrollBadge} />

                            {/* Map */}
                            <MapBadge onPress={onMapPress} style={styles.scrollBadge} />

                            {/* Gems */}
                            <TouchableOpacity onPress={onGemPress} activeOpacity={0.7} style={styles.scrollBadge}>
                                <View style={[styles.miniBadgeFlat, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)' }]}>
                                    <Icon name="diamond-stone" size={20} color="#10B981" />
                                </View>
                            </TouchableOpacity>

                            {/* Streak */}
                            <TouchableOpacity onPress={onStreakPress} activeOpacity={0.7} style={styles.scrollBadge}>
                                <View style={[styles.miniBadgeFlat, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Icon name="fire" size={20} color="#EF4444" />
                                </View>
                            </TouchableOpacity>

                        </GHScrollView>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

/**
 * HeaderBadgeSystem
 * Complete header layout with Avatar, Expandable Pill, and Static Badges
 */
export const HeaderBadgeSystem = ({
    // Avatar Props
    avatarComponent,
    // Badge Press Handlers
    onInventoryPress,
    onTrophyPress,
    onMapPress,
    onNewPress,
    onGemPress,
    onStreakPress,
    // Static Badge Components
    gemBadge,
    streakBadge,
    // Styling
    style,
    containerStyle,
}) => {
    return (
        <View style={[styles.headerContainer, containerStyle]}>
            {/* LEFT: Avatar */}
            <View style={styles.leftSection}>
                {avatarComponent}
            </View>

            {/* CENTER-LEFT: Expandable Pill */}
            <View style={styles.centerSection}>
                <BadgePillContainer
                    onInventoryPress={onInventoryPress}
                    onTrophyPress={onTrophyPress}
                    onMapPress={onMapPress}
                    onNewPress={onNewPress}
                />
            </View>

            {/* RIGHT: Static Badges (Gems + Streak) */}
            <View style={styles.rightSection}>
                {gemBadge}
                {streakBadge}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Header Layout
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 48,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerSection: {
        flex: 1,
        marginLeft: 12,
        alignItems: 'flex-start',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    // Pill Container
    pillContainer: {
        height: 46,  // Larger to accommodate gradient border (2.5px on each side)
        borderRadius: 23,
        overflow: 'hidden',
        shadowColor: '#8a46ff',  // Purple-tinted shadow for glow effect
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    gradientBorderFrame: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 23,
    },
    pillInnerContainer: {
        position: 'absolute',
        top: 2.5,
        left: 2.5,
        right: 2.5,
        bottom: 2.5,
        borderRadius: 20.5,
        overflow: 'hidden',
    },
    androidBlurFallback: {
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    pillContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },

    // Toggle Button
    toggleButton: {
        width: 44,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Badges Wrapper
    badgesWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 0,
        height: 36,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 4,
    },
    scrollBadge: {
        marginHorizontal: 2,
    },

    // Fade Gradients
    fadeGradientLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
        zIndex: 10,
    },
    fadeGradientRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 12,
        zIndex: 10,
    },

    // Mini Badges
    miniBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    miniBadgeDark: {
        backgroundColor: 'rgba(50,50,50,0.9)',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    // Flat version without shadows for Gems/Streak inside pill
    miniBadgeFlat: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    placeholderBadge: {
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        backgroundColor: 'rgba(249,250,251,0.8)',
    },

    // Large Screen Layout - All badges in a row
    largeScreenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    largeScreenBadge: {
        marginHorizontal: 2,
    },
});

export default HeaderBadgeSystem;
