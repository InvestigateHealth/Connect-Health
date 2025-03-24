// src/components/Badge.js
// Badge component for notifications, tags, status indicators

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessibility } from '../hooks/useAccessibility';

/**
 * Badge component for labels, status indicators, and counters
 *
 * @param {Object} props - Additional props for the badge container
 * @param {string|number} props.label - Badge content
 * @param {string} props.variant - Badge variant (primary, secondary, success, warning, error, info)
 * @param {string} props.size - Badge size (small, medium, large)
 * @param {Object} props.style - Additional styles for the badge container
 * @param {Object} props.labelStyle - Additional styles for the badge text
 * @param {boolean} props.dot - Show as a dot instead of with label text
 * @param {boolean} props.outline - Show with outline style instead of filled
 * @param {string} props.testID - Test ID for testing
 */
const Badge = ({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  labelStyle,
  dot = false,
  outline = false,
  testID,
  ...props
}) => {
  const { highContrast } = useAccessibility();
  // Get badge style based on variant
  const getBadgeStyle = () => {
    const baseStyle = outline ? styles.outlineBadge : styles.filledBadge;
    const variantStyles = {
      primary: outline 
        ? { borderColor: theme.colors.primary.main } 
        : { backgroundColor: theme.colors.primary.light },
      secondary: outline 
        ? { borderColor: theme.colors.secondary.main } 
        : { backgroundColor: theme.colors.secondary.light },
      success: outline 
        ? { borderColor: theme.colors.success.main } 
        : { backgroundColor: theme.colors.success.light },
      warning: outline 
        ? { borderColor: theme.colors.warning.main } 
        : { backgroundColor: theme.colors.warning.light },
      error: outline 
        ? { borderColor: theme.colors.error.main } 
        : { backgroundColor: theme.colors.error.light },
      info: outline 
        ? { borderColor: theme.colors.info.main } 
        : { backgroundColor: theme.colors.info.light },
    };

    return { ...baseStyle, ...variantStyles[variant] ?? variantStyles.primary };
  };

  // Get label style based on variant
  const getLabelStyle = (variant, outline) => {
    switch (variant) {
      case 'primary':
        return { color: outline ? theme.colors.primary.main : theme.colors.primary.dark };
      case 'secondary':
        return { color: outline ? theme.colors.secondary.main : theme.colors.secondary.dark };
      case 'success':
        return { color: outline ? theme.colors.success.main : theme.colors.success.dark };
      case 'warning':
        return { color: outline ? theme.colors.warning.main : theme.colors.warning.dark };
      case 'error':
        return { color: outline ? theme.colors.error.main : theme.colors.error.dark };
      case 'info':
        return { color: outline ? theme.colors.info.main : theme.colors.info.dark };
      default:
        return { color: outline ? theme.colors[variant]?.main ?? theme.colors.primary.main : theme.colors[variant]?.dark ?? theme.colors.primary.dark };
    }
  };

  const getSizeStyle = () => {
    const sizeStyles = {
      small: dot ? styles.smallDot : styles.smallBadge,
      medium: dot ? styles.mediumDot : styles.mediumBadge,
      large: dot ? styles.largeDot : styles.largeBadge,
    };
    return sizeStyles[size] || sizeStyles.medium;
  };
  const getLabelSizeStyle = () => {
    const sizeMapping = {
      small: styles.smallLabel,
      medium: styles.mediumLabel,
      large: styles.largeLabel,
    };

    return sizeMapping[size] || sizeMapping.medium;
  };
  const getHighContrastStyle = React.useMemo(() => {
    if (!highContrast) return {};
    
    return {
      borderWidth: outline ? 2 : 1,
      borderColor: '#000000',
    };
  }, [highContrast, outline]);

  // For accessibility
  // Accessibility properties for screen readers
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: dot ? `${variant} indicator` : `${label} ${variant} badge`,
  };

  return (
    <View
      style={[
        getBadgeStyle(),
        getSizeStyle(),
        getHighContrastStyle(),
        style,
      ]}
      testID={testID || 'badge'}
      {...props}
      {...accessibilityProps}
      >
        {!dot && <BadgeLabel label={label} variant={variant} outline={outline} size={size} highContrast={highContrast} labelStyle={labelStyle} getLabelStyle={getLabelStyle} />}
    </View>
  );
};
const BadgeLabel = ({ label, variant, outline, size, highContrast, labelStyle, getLabelStyle }) => {
  return (
    <Text style={[getLabelStyle(variant, outline), styles.label, styles[`${size}Label`], highContrast && styles.highContrastText, labelStyle]}>
      {label}
    </Text>
  );
};

const styles = StyleSheet.create({
  filledBadge: {
    borderRadius: theme.borderRadius.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBadge: {
    borderRadius: theme.borderRadius.circle,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    minWidth: 16,
    height: 16,
  },
  mediumBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minWidth: 20,
    height: 20,
  },
  largeBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minWidth: 24,
    height: 24,
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mediumDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  largeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  label: {
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  smallLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  mediumLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
  largeLabel: {
    fontSize: theme.typography.fontSize.md,
  },
  highContrastText: {
    fontWeight: 'bold',
  },
});

export default Badge;
