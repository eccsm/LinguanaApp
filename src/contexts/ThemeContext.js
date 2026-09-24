import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS_LIGHT, COLORS_DARK, COLORS_CYBERPUNK, COLORS_CALM, SHADOWS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

const ThemeContext = createContext();

// Theme configuration map
const THEME_COLORS = {
  light: COLORS_LIGHT,
  dark: COLORS_DARK,
  cyberpunk: COLORS_CYBERPUNK,
  calm: COLORS_CALM,
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState('light');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('active_theme');
      if (savedTheme && THEME_COLORS[savedTheme]) {
        setActiveTheme(savedTheme);
        setIsDarkMode(savedTheme === 'dark' || savedTheme === 'cyberpunk');
      } else {
        // Legacy support - check old preference
        const legacyTheme = await AsyncStorage.getItem('theme_preference');
        if (legacyTheme === 'dark') {
          setActiveTheme('dark');
          setIsDarkMode(true);
        }
      }
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  };

  // Set a specific theme by ID
  const setTheme = async (themeId) => {
    try {
      if (!THEME_COLORS[themeId]) {
        console.warn(`Theme "${themeId}" not found, falling back to light`);
        themeId = 'light';
      }
      setActiveTheme(themeId);
      setIsDarkMode(themeId === 'dark' || themeId === 'cyberpunk');
      await AsyncStorage.setItem('active_theme', themeId);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  // Toggle between light and dark (legacy support)
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const theme = {
    colors: THEME_COLORS[activeTheme] || COLORS_LIGHT,
    activeTheme,
    isDarkMode,
    reducedMotion: activeTheme === 'calm', // Calm theme reduces animations
    toggleTheme,
    setTheme,
    shadows: SHADOWS,
    spacing: SPACING,
    fontSizes: FONT_SIZES,
    borderRadius: BORDER_RADIUS,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
