// src/components/AccessibleTouchable.js
// Accessible touchable component with enhanced accessibility features

import React, { useState } from 'react';
import { 
  AccessibilityInfo,
  Platform, 
  StyleSheet,
  TouchableNativeFeedback, 
  TouchableOpacity, 
  View
} from 'react-native';
import { useAccessibility } from '../hooks/useAccessibility';

/**
 * AccessibleTouchable component that respects accessibility settings
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Content to render inside touchable
 * @param {Object} props.style - Container style
 * @param {Function} props.onPress - Function to call when pressed
 * @param {Function} props.onLongPress - Function to call when long-pressed
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.accessibilityHint - Accessibility hint
 * @param {string} props.testID - Test ID for testing
 * @param {boolean} props.useFeedback - Whether to use native feedback on Android (ripple effect)
 * @param {boolean} props.disableAnimation - Whether to disable animations for reduced motion
 * @param {number} props.activeOpacity - Active opacity when touched (default: 0.7)
 * @param {boolean} props.disabled - Whether the touchable is disabled
 * @param {Object} props.hitSlop - Hit slop for touchable area (default: { top: 10, right: 10, bottom: 10, left: 10 })
 */
// Debounce function to limit the rate of function execution
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const AccessibleTouchable = ({
  children,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  useFeedback = Platform.OS === 'android',
  disableAnimation = false,
  activeOpacity = 0.7,
  disabledOpacity = 0.5,
  hitSlop = { top: 10, right: 10, bottom: 10, left: 10 },
  style,
  disabled,
  ...props
}) => {
  const { reducedMotion, screenReaderEnabled } = useAccessibility();
  const [isPressed, setIsPressed] = useState(false);
  
  // Determine appropriate active opacity based on accessibility settings
  const getActiveOpacity = () => {
    if (disableAnimation || reducedMotion) {
      return 0.9; // Less animation when reduced motion is enabled
    }
    return activeOpacity;
  };
  
  // Debounced announce function
  const debouncedAnnounceForAccessibility = debounce((message) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, 300);

  // Handle press in
  const handlePressIn = () => {
    setIsPressed(true);
    if (screenReaderEnabled) {
      // Announce to screen reader that button is pressed
      debouncedAnnounceForAccessibility(`${accessibilityLabel || 'Button'} pressed`);
    }
  };

  // Handle press out
  
  // Handle press out
  const handlePressOut = () => {
    setIsPressed(false);
  };
  
  // Accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel,
    accessibilityHint,
    accessibilityState: {
      disabled,
      pressed: isPressed,
    },
  };
  
  if (Platform.OS === 'android' && useFeedback && !disableAnimation && !reducedMotion) {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        background={TouchableNativeFeedback.Ripple('rgba(0, 0, 0, 0.1)', true)}
        useForeground={true}
        testID={testID || 'accessible-touchable'}
        hitSlop={hitSlop}
        {...accessibilityProps}
        {...props}
      >
        <View style={[styles.container, style, disabled && styles.disabledContainer]}>
          {children}
        </View>
      </TouchableNativeFeedback>
    );
  }
  
  // Use TouchableOpacity on iOS or when useFeedback is false
  return (
    <TouchableOpacity
      style={[styles.container, style, disabled && { opacity: disabledOpacity }]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={getActiveOpacity()}
      disabled={disabled}
      testID={testID || 'accessible-touchable'}
      hitSlop={hitSlop}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.5,
  }
});

export default AccessibleTouchable;
