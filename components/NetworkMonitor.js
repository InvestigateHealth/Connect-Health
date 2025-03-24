// src/components/NetworkMonitor.js
// Component to display network status with proper animation configs

import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform,
  AccessibilityInfo
} from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { useTheme } from '../theme/ThemeContext';
import { useAccessibility } from '../hooks/useAccessibility';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const NetworkMonitor = ({ isConnected, isInternetReachable, reducedMotion }) => {
  const { theme } = useTheme();
  const isOffline = !isConnected || isInternetReachable === false;
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current; // Start offscreen

  useAnnounceNetworkChange(isOffline);
  useHandleVisibility(isOffline, visible, setVisible, slideAnim, reducedMotion);

  // Early return if the network status is not visible
  if (!visible) {
    return null;
  }

  return renderNetworkStatus(theme, slideAnim);
};

const useAnnounceNetworkChange = (isOffline) => {
  useEffect(() => {
    const announceNetworkChange = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (screenReaderEnabled && isOffline) {
        const message = "No Internet Connection";
        AccessibilityInfo.announceForAccessibility(message);
      }
    };
    
    announceNetworkChange();
  }, [isOffline]);
};

const useHandleVisibility = (isOffline, visible, setVisible, slideAnim, reducedMotion) => {
  useEffect(() => {
    if (isOffline && !visible) {
      setVisible(true);
      
      // If reduced motion is enabled, skip animation
      if (reducedMotion) {
        slideAnim.setValue(0);
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true, // Enable native driver for better performance (translateY is supported)
        }).start();
      }
    } else if (!isOffline && visible) {
      // If reduced motion is enabled, skip animation and hide immediately
      if (reducedMotion) {
        setVisible(false);
        slideAnim.setValue(-50);
      } else {
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true, // Enable native driver for better performance
        }).start(() => {
          setVisible(false);
        });
      }
    }
  }, [isOffline, visible, reducedMotion]);
};

const renderNetworkStatus = (theme, slideAnim) => (
  <Animated.View 
    style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.error.main,
        transform: [{ translateY: slideAnim }]
      }
    ]}
    accessibilityRole="alert"
    accessibilityLabel="Network status alert"
    accessibilityLiveRegion="assertive">
    <Icon name="cloud-offline" size={20} color="white" />
    <Text style={styles.text}>No Internet Connection</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 9999,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  text: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default NetworkMonitor;