/**
 * GlassContainer - A reusable Glassmorphism container component
 * 
 * Implements a modern frosted glass effect using @react-native-community/blur
 * with semi-transparent backgrounds and subtle borders for a premium look.
 * 
 * Supports: Light, Dark, and Cyberpunk themes
 * 
 * NOTE: On Android, blur effect is limited. We use a semi-transparent fallback
 * that still achieves the glassmorphism aesthetic.
 */

import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    Platform,
    StyleProp,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, COLORS_DARK, COLORS_CYBERPUNK } from '../../constants/theme';

interface GlassContainerProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Style to apply to the content wrapper (for flexDirection, padding, etc.) */
    contentStyle?: StyleProp<ViewStyle>;
    /** Blur intensity (0-100). Recommended: 20-30 for glass effect. iOS only. */
    intensity?: number;
    /** Blur type for iOS */
    blurType?: 'light' | 'dark' | 'chromeMaterial' | 'material' | 'thickMaterial' | 'thinMaterial' | 'ultraThinMaterial' | 'regular' | 'prominent' | 'xlight';
    /** Additional border radius */
    borderRadius?: number;
    /** Whether to apply the colored glass tint based on theme */
    tinted?: boolean;
}

/**
 * Helper function to convert hex color to rgba
 */
const hexToRgba = (hex: string, opacity: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${opacity})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Extract flex and layout properties from style to apply to content wrapper
 */
const extractLayoutStyles = (style: StyleProp<ViewStyle>): ViewStyle => {
    if (!style) return {};

    const flatStyle = StyleSheet.flatten(style) || {};
    const layoutProps: ViewStyle = {};

    // Extract properties that should be applied to content wrapper
    const layoutKeys: (keyof ViewStyle)[] = [
        'flexDirection',
        'alignItems',
        'justifyContent',
        'flexWrap',
        'padding',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'paddingHorizontal',
        'paddingVertical',
    ];

    layoutKeys.forEach((key) => {
        if (flatStyle[key] !== undefined) {
            (layoutProps as any)[key] = flatStyle[key];
        }
    });

    return layoutProps;
};

/**
 * Get theme-specific glass styles
 */
const getThemeGlassStyles = (activeTheme: string, tinted: boolean) => {
    switch (activeTheme) {
        case 'cyberpunk':
            return {
                // Cyberpunk: Neon glow with dark purple background
                // Higher opacity on Android since no blur
                glassBackgroundColor: tinted
                    ? hexToRgba(COLORS_CYBERPUNK.primary, Platform.OS === 'ios' ? 0.15 : 0.25)
                    : hexToRgba(COLORS_CYBERPUNK.surface, Platform.OS === 'ios' ? 0.85 : 0.92),
                glassBorderColor: tinted
                    ? hexToRgba(COLORS_CYBERPUNK.primary, 0.4)
                    : hexToRgba(COLORS_CYBERPUNK.secondary, 0.3),
                shadowColor: COLORS_CYBERPUNK.glowColor,
                shadowOpacity: 0.5,
                blurType: 'dark' as const,
            };

        case 'dark':
            return {
                // Dark: Subtle glass with dark surface
                glassBackgroundColor: tinted
                    ? hexToRgba(COLORS_DARK.primary, Platform.OS === 'ios' ? 0.12 : 0.20)
                    : hexToRgba(COLORS_DARK.surface, Platform.OS === 'ios' ? 0.75 : 0.88),
                glassBorderColor: 'rgba(255, 255, 255, 0.15)',
                shadowColor: '#000',
                shadowOpacity: 0.4,
                blurType: 'dark' as const,
            };

        case 'light':
        default:
            return {
                // Light: Clean frosted glass
                // On Android, use higher opacity since blur won't work well
                glassBackgroundColor: tinted
                    ? hexToRgba(COLORS.primary, Platform.OS === 'ios' ? 0.10 : 0.15)
                    : hexToRgba(COLORS.surface, Platform.OS === 'ios' ? 0.70 : 0.90),
                glassBorderColor: 'rgba(255, 255, 255, 0.4)',
                shadowColor: COLORS.primary,
                shadowOpacity: 0.15,
                blurType: 'light' as const,
            };
    }
};

const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    style,
    contentStyle,
    intensity = 25,
    blurType,
    borderRadius = 24,
    tinted = false,
}) => {
    const { activeTheme, colors } = useTheme();

    // Get theme-specific glass styles
    const themeStyles = getThemeGlassStyles(activeTheme, tinted);

    // Use provided blurType or theme default
    const effectiveBlurType = blurType || themeStyles.blurType;

    // Extract layout styles to apply to content wrapper
    const layoutStyles = extractLayoutStyles(style);

    // On iOS, use BlurView for real blur effect
    // On Android, skip BlurView (doesn't work well) and rely on semi-transparent overlay
    const shouldUseBlur = Platform.OS === 'ios';

    return (
        <View
            style={[
                styles.container,
                {
                    borderRadius,
                    backgroundColor: Platform.OS === 'android'
                        ? themeStyles.glassBackgroundColor // Android needs background for elevation
                        : 'transparent',
                    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible', // Don't clip shadow on Android
                    // Shadow for depth/separation
                    shadowColor: themeStyles.shadowColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: themeStyles.shadowOpacity,
                    shadowRadius: 16,
                    elevation: 10,
                },
                style,
            ]}
        >
            {/* BlurView as background - iOS only for performance */}
            {shouldUseBlur && (
                <BlurView
                    style={[StyleSheet.absoluteFill, { borderRadius }]}
                    blurType={effectiveBlurType}
                    blurAmount={intensity}
                    reducedTransparencyFallbackColor={colors.surface}
                />
            )}

            {/* Glass tint overlay - works on both platforms */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: themeStyles.glassBackgroundColor,
                        borderRadius,
                    },
                ]}
            />

            {/* Glass border effect */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius,
                        borderWidth: 1,
                        borderColor: themeStyles.glassBorderColor,
                    },
                ]}
            />

            {/* Content - apply extracted layout styles */}
            <View style={[styles.content, layoutStyles, contentStyle]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    content: {
        position: 'relative',
        zIndex: 1,
        // Content should fill the container
        flex: 1,
    },
});

export default GlassContainer;
