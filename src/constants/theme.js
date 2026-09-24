// Modern Linguana Theme - Purple Gradient Design
export const COLORS = {
  // Primary gradient colors (purple from auth screen)
  primary: '#8a46ff',
  primaryDark: '#6e3ff0',
  primaryLight: '#a84fe8',
  primaryGradient: ['#6e3ff0', '#a84fe8'],

  // Secondary colors
  secondary: '#c34aff',
  secondaryDark: '#a84fe8',
  secondaryLight: '#d66fff',
  secondaryGradient: ['#8a46ff', '#c34aff'],

  // Accent colors
  accent: '#e3d7ff',
  accentDark: '#d4c5ff',
  accentGradient: ['#e3d7ff', '#f0ebff'],

  // Neutral colors - Modern palette
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  // Text colors
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Borders and dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const COLORS_LIGHT = COLORS;

export const COLORS_DARK = {
  // Primary - Keep same or slightly adjust for dark mode
  primary: '#9d65ff', // Slightly lighter for better contrast on dark
  primaryDark: '#7f52e0',
  primaryLight: '#b580ff',
  primaryGradient: ['#7f52e0', '#b580ff'],

  // Secondary
  secondary: '#d27aff',
  secondaryDark: '#b580ff',
  secondaryLight: '#e09aff',
  secondaryGradient: ['#9d65ff', '#d27aff'],

  // Accent
  accent: '#2A2A40',
  accentDark: '#1F1F30',
  accentGradient: ['#2A2A40', '#353550'],

  // Neutral colors - Dark palette
  background: '#121212', // Very dark grey/black
  surface: '#1E1E1E', // Slightly lighter
  surfaceElevated: '#2C2C2C',
  card: '#1E1E1E',

  // Text colors
  text: '#F5F7FA', // Almost white
  textSecondary: '#A0AEC0', // Light grey
  textTertiary: '#6B7280', // Darker grey

  // Borders and dividers
  border: '#2D3748',
  divider: '#2D3748',

  // Status colors
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// Cyberpunk Theme - Neon Pink/Cyan aesthetic
export const COLORS_CYBERPUNK = {
  // Primary - Neon Pink
  primary: '#ff2d95',
  primaryDark: '#d91a7a',
  primaryLight: '#ff5aaf',
  primaryGradient: ['#ff2d95', '#f40076'],

  // Secondary - Electric Cyan
  secondary: '#00f0ff',
  secondaryDark: '#00c8d9',
  secondaryLight: '#5ff5ff',
  secondaryGradient: ['#00f0ff', '#00c8d9'],

  // Accent - Purple glow
  accent: '#8b5cf6',
  accentDark: '#7c3aed',
  accentGradient: ['#8b5cf6', '#a855f7'],

  // Neutral colors - Deep dark purple/blue
  background: '#0d0221', // Very dark purple
  surface: '#1a0a2e', // Dark purple surface
  surfaceElevated: '#2d1b4e',
  card: '#1a0a2e',

  // Text colors - Neon glow effect
  text: '#f0f0ff', // Slightly blue-white
  textSecondary: '#b8b8ff', // Light purple
  textTertiary: '#8080a0',

  // Borders - Neon glow borders
  border: '#ff2d9580', // Semi-transparent neon pink (increased opacity)
  cardBorder: '#ff2d95', // Solid neon pink for active borders
  divider: '#00f0ff30', // Semi-transparent cyan

  // Glows
  glowColor: '#ff2d95',
  glowColorSecondary: '#00f0ff',

  // Status colors - Neon versions
  success: '#39ff14', // Neon green
  error: '#ff3131', // Bright red
  warning: '#ffff00', // Neon yellow
  info: '#00f0ff', // Cyan

  // Overlay
  overlay: 'rgba(13, 2, 33, 0.9)',
  overlayLight: 'rgba(13, 2, 33, 0.7)',
};

// Calm/Epilepsy-Aware Theme - Reduced contrast, muted colors, accessibility-focused
export const COLORS_CALM = {
  // Primary - Soft, muted teal (calming color)
  primary: '#5C9A9A',
  primaryDark: '#4A8080',
  primaryLight: '#7AB5B5',
  primaryGradient: ['#5C9A9A', '#7AB5B5'], // Subtle gradient

  // Secondary - Soft lavender
  secondary: '#9B8AA5',
  secondaryDark: '#7D6B87',
  secondaryLight: '#B8A8C2',
  secondaryGradient: ['#9B8AA5', '#B8A8C2'],

  // Accent - Muted sage
  accent: '#A8B5A0',
  accentDark: '#8A9A82',
  accentGradient: ['#A8B5A0', '#C0CDB8'],

  // Neutral colors - Soft, warm grays
  background: '#F5F3F0', // Warm off-white
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF8',
  card: '#FFFFFF',

  // Text colors - Reduced contrast (not pure black)
  text: '#3D3D3D', // Dark gray instead of black
  textSecondary: '#6B6B6B',
  textTertiary: '#8A8A8A',

  // Borders - Very subtle
  border: '#E0DDD8',
  divider: '#EBE8E4',

  // Status colors - Muted, less saturated versions
  success: '#6BAF6B', // Muted green
  error: '#C47575', // Muted red (less alarming)
  warning: '#C4A866', // Muted amber
  info: '#6B9AC4', // Muted blue

  // Overlay - Lighter overlays
  overlay: 'rgba(61, 61, 61, 0.4)', // Less intense
  overlayLight: 'rgba(61, 61, 61, 0.2)',

  // Special accessibility flag
  isReducedMotion: true, // Flag for components to check
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Modern shadow styles
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
};
