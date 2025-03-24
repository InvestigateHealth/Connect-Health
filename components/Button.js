import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View 
} from 'react-native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Button component with different variants
 */
export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...restProps
}) => {
  // Get button style based on variant
  const buttonStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    outline: styles.outlineButton,
    text: styles.textButton,
  };

  const getButtonStyle = () => buttonStyles[variant] || styles.primaryButton;
  
  // Get text style based on variant
  const textStyles = {
    primary: styles.primaryButtonText,
    secondary: styles.primaryButtonText,
    outline: styles.outlineButtonText,
    text: styles.textButtonText,
  };

  const getTextStyle = () => textStyles[variant] || styles.primaryButtonText;
  
  const sizeStyles = {
    small: styles.smallButton,
    large: styles.largeButton,
  };

  const getSizeStyle = () => sizeStyles[size] || null;
  
  const renderIcon = () => {
    const iconColor = 
      variant === 'primary' || variant === 'secondary'
        ? theme.colors.common.white
        : theme.colors.primary.main;
    
    return (
      <Icon 
        name={icon} 
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
        color={iconColor}
        style={[
          iconPosition === 'left' ? buttonStyles.iconLeft : buttonStyles.iconRight
        ]}
      />
    );
  };
  
  return (
    <TouchableOpacity
      style={[
        buttonStyles.button,
        getButtonStyle(),
        getSizeStyle(),
        disabled && buttonStyles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'secondary'
              ? theme.colors.common.white
              : theme.colors.primary.main
          }
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && renderIcon()}
          <Text
            style={[
              getTextStyle(),
              textStyle
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary.main,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.common.white,
  },
  textButton: {
    backgroundColor: 'transparent',
    padding: theme.spacing.xs,
  },
  smallButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  largeButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  primaryButtonText: {
    color: theme.colors.common.white,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  outlineButtonText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  textButtonText: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  smallButtonText: {
    fontSize: theme.typography.fontSize.sm,
  },
  largeButtonText: {
    fontSize: theme.typography.fontSize.lg,
  },
  contentContainer: {
    flexDirection: 'row',
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  }
});

export default Button;
export const Avatar = ({
  source,
  size = 'medium',
  onPress,
  style,
  ...restProps
}) => {
  // Calculate avatar size
  const getSize = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 80;
      case 'xlarge':
        return 120;
      default: // medium
        return 50;
    }
  };

  // Calculate icon size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 40;
      case 'xlarge':
        return 60;
      default: // medium
        return 25;
    }
  };

  const avatarSize = getSize();
  const iconSize = getIconSize();

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        avatarStyles.avatar,
        style,
      ]}
      onPress={onPress}
      {...restProps}
    >
      {source ? (
        <FastImage
          source={{ uri: source }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="person" size={iconSize} color="#FFFFFF" />
        </View>
      )}
    </Wrapper>
  );
};

const avatarStyles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: theme.colors.gray[500],
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// src/components/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Reusable empty state component

// src/components/LoadingIndicator.js
// Reusable loading indicator with overlay option

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

/**
 * Loading indicator component
 */
export const LoadingIndicator = ({
  size = 'large',
  color = theme.colors.primary.main,
  overlay = false,
  text,
  style,
  ...restProps
}) => {
  if (overlay) {
    return (
      <View style={[styles.overlayContainer, style]} {...restProps}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={color} />
          {text && <Text style={styles.text}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} {...restProps}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
  },
});

// src/components/ErrorView.js
// Reusable error display component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button } from './Button';
import { theme } from '../theme/theme';

/**
 * Error display component
 */
export const ErrorView = ({
  error,
  onRetry,
  style,
  ...restProps
}) => {
  return (
    <View style={[styles.container, style]} {...restProps}>
      <Icon name="alert-circle-outline" size={60} color={theme.colors.error.main} style={styles.icon} />
      
      <Text style={styles.title}>Something went wrong</Text>
      
      {error && <Text style={styles.message}>{error}</Text>}
      
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          style={styles.button}
          variant="primary"
        />
      )}
    </View>
  );
};

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});

// src/components/ListItem.js
// Reusable list item component

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Avatar } from './Avatar';
import { theme } from '../theme/theme';

/**
 * List item component
 */
export const ListItem = ({
  title,
  subtitle,
  leftIcon,
  leftAvatar,
  rightIcon = 'chevron-forward',
  onPress,
  style,
  ...restProps
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      {...restProps}
    >
      {/* Left element (icon or avatar) */}
      {leftIcon && !leftAvatar && (
        <View style={styles.leftIcon}>
          <Icon name={leftIcon} size={24} color={theme.colors.text.secondary} />
        </View>
      )}
      
      {leftAvatar && (
        <View style={styles.leftAvatar}>
          <Avatar source={leftAvatar} size="small" />
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        <Text 
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text 
            style={styles.subtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* Right element (icon) */}
      {rightIcon && onPress && (
        <View style={styles.rightIcon}>
          <Icon name={rightIcon} size={20} color={theme.colors.gray[400]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const listItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  leftIcon: {
    marginRight: theme.spacing.md,
  },
  leftAvatar: {
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
});

// src/components/Divider.js
// Simple divider component

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

/**
 * Divider component
 */
export const Divider = ({ style, ...restProps }) => {
  return <View style={[styles.divider, style]} {...restProps} />;
};

const dividerStyles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
});

// src/components/Badge.js
// Badge component for notifications, tags, etc.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

/**
 * Badge component
 */
export const Badge = ({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  labelStyle,
  ...restProps
}) => {
  // Get badge style based on variant
  const getBadgeStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryBadge;
      case 'secondary':
        return styles.secondaryBadge;
      case 'success':
        return styles.successBadge;
      case 'warning':
        return styles.warningBadge;
      case 'error':
        return styles.errorBadge;
      case 'info':
        return styles.infoBadge;
      default:
        return styles.primaryBadge;
    }
  };
  
  // Get label style based on variant
  const getLabelStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryLabel;
      case 'secondary':
        return styles.secondaryLabel;
      case 'success':
        return styles.successLabel;
      case 'warning':
        return styles.warningLabel;
      case 'error':
        return styles.errorLabel;
      case 'info':
        return styles.infoLabel;
      default:
        return styles.primaryLabel;
    }
  };
  
  // Get size style
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallBadge;
      case 'large':
        return styles.largeBadge;
      default:
        return null;
    }
  };
  
  // Get label size style
  const getLabelSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallLabel;
      case 'large':
        return styles.largeLabel;
      default:
        return null;
    }
  };
  
  return (
    <View 
      style={[
        styles.badge,
        getBadgeStyle(),
        getSizeStyle(),
        style
      ]}
      {...restProps}
    >
      <Text 
        style={[
          styles.label,
          getLabelStyle(),
          getLabelSizeStyle(),
          labelStyle
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.circle,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  primaryBadge: {
    backgroundColor: theme.colors.primary.light,
  },
  secondaryBadge: {
    backgroundColor: theme.colors.secondary.light,
  },
  successBadge: {
    backgroundColor: theme.colors.success.light,
  },
  warningBadge: {
    backgroundColor: theme.colors.warning.light,
  },
  errorBadge: {
    backgroundColor: theme.colors.error.light,
  },
  infoBadge: {
    backgroundColor: theme.colors.info.light,
  },
  smallBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  largeBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  primaryLabel: {
    color: theme.colors.primary.dark,
  },
  secondaryLabel: {
    color: theme.colors.secondary.dark,
  },
  successLabel: {
    color: theme.colors.success.dark,
  },
  warningLabel: {
    color: theme.colors.warning.dark,
  },
  errorLabel: {
    color: theme.colors.error.dark,
  },
  infoLabel: {
    color: theme.colors.info.dark,
  },
  smallLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  largeLabel: {
    fontSize: theme.typography.fontSize.md,
  },
});