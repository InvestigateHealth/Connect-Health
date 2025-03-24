// src/theme/ThemeContext.js
// Enhanced theme context with improved type definitions

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeDefinitions, { lightTheme, darkTheme, highContrastTheme } from './themeColors';
import { useAccessibility as importedUseAccessibility } from '../hooks/useAccessibility';

// Fallback in case the hook is not available
const fallbackUseAccessibility = () => ({ highContrast: false });
const useAccessibility = importedUseAccessibility || fallbackUseAccessibility;

// Theme mode enum
export const ThemeMode = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * @typedef {Object} ThemeContextValue
 * @property {object} theme - The current theme object.
 * @property {string} themeMode - The current theme mode.
 * @property {boolean} isDarkMode - Whether dark mode is enabled.
 * @property {function} changeThemeMode - Function to change the theme mode.
 * @property {function} toggleTheme - Function to toggle between light and dark themes.
 */

/**
 * Initial context value with default values.
 * @property {object} theme - The default theme object (light theme).
 * @property {string} themeMode - The default theme mode (system).
 * @property {boolean} isDarkMode - Default dark mode status (false).
 * @property {function} changeThemeMode - Default function to change the theme mode (no-op).
 * @property {function} toggleTheme - Default function to toggle between light and dark themes (no-op).
 */
const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: ThemeMode.SYSTEM,
  isDarkMode: false,
  changeThemeMode: () => {}, // Default changeThemeMode function is a no-op
  toggleTheme: () => {}, // Default toggleTheme function is a no-op
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get device color scheme
  const colorScheme = useColorScheme();
  
  const [themeState, setThemeState] = useState({
    themeMode: ThemeMode.SYSTEM,
    theme: lightTheme,
    isDarkMode: false,
  });
  // State for theme mode
  const [themeMode, setThemeMode] = useState(ThemeMode.SYSTEM);
  const [theme, setTheme] = useState(lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Load saved theme mode on mount
  const loadThemeMode = useCallback(async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      if (savedThemeMode) {
        let parsedThemeMode;
        try {
          parsedThemeMode = JSON.parse(savedThemeMode);
        } catch (e) {
          parsedThemeMode = savedThemeMode;
        }
        if (Object.values(ThemeMode).includes(parsedThemeMode)) {
          setThemeMode(parsedThemeMode);
        }
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  }, []);

  useEffect(() => {
    loadThemeMode();
  }, [loadThemeMode]);
  
  // Update theme when theme mode or system theme changes
  useEffect(() => {
    let effectiveThemeMode;
    
    // If system theme, use device preference
    if (themeMode === ThemeMode.SYSTEM) {
      effectiveThemeMode = colorScheme === 'dark' ? ThemeMode.DARK : ThemeMode.LIGHT;
    } else {
      effectiveThemeMode = themeMode;
    }

    // Set dark mode flag
    const newIsDarkMode = effectiveThemeMode === ThemeMode.DARK;
    setThemeState(prevState => ({ ...prevState, isDarkMode: newIsDarkMode }));

    if (accessibility.highContrast) {
      setThemeState(prevState => ({ ...prevState, theme: highContrastTheme }));
    } else {
      setThemeState(prevState => ({ ...prevState, theme: newIsDarkMode ? darkTheme : lightTheme }));
    }
  }, [themeMode, colorScheme, accessibility.highContrast]);
  
  // Save theme mode when it changes
  const saveThemeMode = useCallback(async () => {
    try {
      await AsyncStorage.setItem('themeMode', themeMode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  }, [themeMode]);

  const changeThemeMode = (newMode) => {
    if (Object.values(ThemeMode).includes(newMode)) {
      setThemeMode(newMode);

      // Update theme immediately
      let effectiveThemeMode = newMode;

      if (newMode === ThemeMode.SYSTEM) {
        effectiveThemeMode = colorScheme === 'dark' ? ThemeMode.DARK : ThemeMode.LIGHT;
      }

      const newIsDarkMode = effectiveThemeMode === ThemeMode.DARK;

      if (accessibility.highContrast) {
        setTheme(highContrastTheme);
      } else {
        setTheme(newIsDarkMode ? darkTheme : lightTheme);
      }

      // Save the new theme mode
      saveThemeMode();
    }
  };

  const toggleTheme = () => {
    // If in system mode, switch to explicit light/dark mode
    if (themeMode === ThemeMode.SYSTEM) {
      setThemeMode(isDarkMode ? ThemeMode.LIGHT : ThemeMode.DARK);
    } else {
      // Otherwise toggle between light and dark
      const newMode = themeMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
      setThemeMode(newMode);

      // Update theme immediately
      const newIsDarkMode = newMode === ThemeMode.DARK;
      
      if (accessibility.highContrast) {
        setTheme(highContrastTheme);
      } else {
        setTheme(newIsDarkMode ? darkTheme : lightTheme);
      }
    }
    saveThemeMode();
  };
  
  const contextValue = {
    theme: themeState.theme,
    themeMode,
    isDarkMode: themeState.isDarkMode,
    changeThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context.
 * 
 * @returns {{
 *   theme: object,
 *   themeMode: string,
  };
  
  const contextValue = {
    theme: themeState.theme,
    themeMode: themeState.themeMode,
    isDarkMode: themeState.isDarkMode,
    changeThemeMode,
    toggleTheme,
  };
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context.
 * 
 * @returns {{
 *   theme: object,
 *   themeMode: string,
 *   isDarkMode: boolean,
 *   changeThemeMode: (newMode: string) => void,
 *   toggleTheme: () => void
 * }} The current theme context value.
 * @property {object} theme - The current theme object.
 * @property {string} themeMode - The current theme mode.
 * @property {boolean} isDarkMode - Whether dark mode is enabled.
 * @property {function} changeThemeMode - Function to change the theme mode.
 * @property {function} toggleTheme - Function to toggle between light and dark themes.
 */
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
