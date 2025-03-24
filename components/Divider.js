// src/components/Divider.js
// Simple divider component with theming and accessibility

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { useAccessibility } from '../hooks/useAccessibility';
import AccessibleText from './AccessibleText';

/**
 * Divider component for visually separating content
 * 
 * @param {Object} props
 * @param {string} props.orientation - Divider orientation (horizontal or vertical)
 * @param {string} props.variant - Divider variant (full, inset, middle)
 * @param {string} props.label - Optional text label to show in the middle of the divider
 * @param {string} props.thickness - Divider thickness in pixels
 * @param {string} props.color - Divider color
 * @param {Object} props.style - Additional styles for the divider
 * @param {Object} props.labelStyle - Additional styles for the label
 * @param {string} props.testID - Test ID for testing
 */
const DEFAULT_VARIANT = 'full';

const Divider = ({
  orientation = 'horizontal', // default orientation is horizontal
  thickness = theme.spacing.xs, // use a value from the theme for consistency
  variant = DEFAULT_VARIANT,
  label,
  color = theme.colors.divider,
  style,
  labelStyle,
  testID,
  ...props
}) => {
  const { highContrast } = useAccessibility();

  // Get variant style
  const getVariantStyle = (variant, orientation) => 
    variant === 'inset'
      ? orientation === 'vertical'
        ? styles.insetVertical
        : styles.insetHorizontal
      : variant === 'middle'
      ? orientation === 'vertical'
        ? styles.middleVertical
        : styles.middleHorizontal
        : null;
  
    // Handle both labeled and simple dividers
    return label ? (
      <View
        style={[styles.labelContainer, style]} 
        testID={testID || 'labeled-divider'}
        accessibilityRole="separator"
        accessibilityLabel={label || 'divider'}
        {...props}
      >
        <View 
          style={[
            styles.horizontal, 
            getVariantStyle(variant, orientation), 
            {
              backgroundColor: highContrast ? '#000000' : color,
              [orientation === 'vertical' ? 'width' : 'height']: thickness,
            },
            styles.labelDividerLeft
          ]} 
        />
        <AccessibleText
          variant="caption"
          style={[styles.label, labelStyle]}
        >
          {label}
        </AccessibleText>
        <View 
          style={[
            styles.horizontal, 
            getVariantStyle(variant, orientation), 
            {
              backgroundColor: highContrast ? '#000000' : color,
              [orientation === 'vertical' ? 'width' : 'height']: thickness,
            },
            styles.labelDividerRight
          ]} 
        />
      </View>
    ) : (
      <View
        style={[
          orientation === 'vertical' ? styles.vertical : styles.horizontal,
          getVariantStyle(variant, orientation),
          {
            backgroundColor: highContrast ? '#000000' : color,
            [orientation === 'vertical' ? 'width' : 'height']: thickness,
          },
          style,
        ]}
        accessibilityRole="separator"
        accessibilityLabel="divider"
        {...props}
      />
    );
  };

  // Simple divider
const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: theme.colors.divider,
    alignSelf: 'stretch',
  },
  vertical: {
    width: 1,
    backgroundColor: theme.colors.divider,
    alignSelf: 'stretch',
  },
  insetHorizontal: {
    marginLeft: theme.spacing.lg,
    marginRight: theme.spacing.lg,
  },
  insetVertical: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  middleHorizontal: {
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  middleVertical: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  label: {
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  labelDividerLeft: {
    flex: 1,
  },
  labelDividerRight: {
    flex: 1,
  },
});

export default Divider;
