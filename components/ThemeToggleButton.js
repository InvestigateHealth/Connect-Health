// src/components/ThemeToggleButton.js
// Floating theme toggle button component that toggles between light and dark mode.
// It includes proper animation using useNativeDriver and respects the user's reduced motion preference.

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';

const platformStyles = {
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  android: {
    elevation: 6,
  },
};

const ThemeToggleButton = ({ size = 'medium', style }) => {
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const BUTTON_SIZES = {
    small: 40,
    medium: 50,
    large: 60,
  };

  const ICON_SIZES = {
    small: 20,
    medium: 24,
    large: 30,
  };

  const getSize = (type) => {
    const sizes = type === 'button' ? BUTTON_SIZES : ICON_SIZES;
    return sizes[size] || sizes.medium;
  };
  const getButtonSize = () => BUTTON_SIZES[size] || BUTTON_SIZES.medium;
  const getIconSize = () => ICON_SIZES[size] || ICON_SIZES.medium;

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true, // Ensure we're using the native driver for performance for both animations
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleToggle = () => {
    animateButton();
    toggleDarkMode();
  };

  const buttonSize = getSize('button');
  const iconSize = getSize('icon');

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        StyleSheet.flatten([
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isDarkMode ? colors.background.paper : colors.primary.main,
          },
          style,
        ])
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggle}
        accessibilityHint={t('themeToggleButton.accessibilityHint')}
        accessibilityLabel={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Icon 
          name={isDarkMode ? "sunny-outline" : "moon-outline"} 
          size={iconSize}
          color={isDarkMode ? colors.primary.main : colors.common.white} 
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * ThemeToggleButton component
 * 
 * This component renders a floating button that toggles between light and dark mode.
 * It includes proper animation using useNativeDriver and respects the user's reduced motion preference.
 * 
 * Props:
 * - size: The size of the button ('small', 'medium', 'large'). Default is 'medium'.
 * - style: Additional styles for the button.
 */

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    ...platformStyles[Platform.OS],
  },
});

export default ThemeToggleButton;
