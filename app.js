// App.js
// Main app entry point - Production ready version with i18n support and optimized initialization

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StatusBar, View, Text, I18nManager, Platform } from 'react-native';
import { AppState } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Config from 'react-native-config';
import { LogBox } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import notifee from '@notifee/react-native';
import { useTranslation } from 'react-i18next';

// Import screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import AppNavigator from './src/navigation/AppNavigator';
import LanguageSettingsScreen from './src/screens/LanguageSettingsScreen';

// Import providers
import { UserProvider, useUser } from './src/contexts/UserContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { NetworkProvider, useNetwork } from './src/contexts/NetworkContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { BlockedUsersProvider } from './src/contexts/BlockedUsersContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Import utilities
import { initializeDeepLinking, cleanupDeepLinking } from './src/utils/deepLinking';
import { AnalyticsService } from './src/services/AnalyticsService';
import notificationService from './src/services/NotificationService';
import navigationService from './src/services/NavigationService';
import { formatDistanceToNow } from 'date-fns';

// Import internationalization
import './src/i18n';

// RTL support is now fully handled via Language Context Provider
import { LanguageProvider } from './src/contexts/LanguageContext';
import * as Keychain from 'react-native-keychain';

// Ignore specific warnings to prevent unnecessary log clutter during development
// These warnings are known issues with dependencies and do not affect app functionality
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'AsyncStorage has been extracted from react-native',
  'Non-serializable values were found in the navigation state'
]);


// Create a loading component to show during initialization
/**
 * InitializingApp component
 * @param {Object} props - Component props
 * @param {string} props.progress - Initialization progress message
 * @param {string} props.appVersion - Application version
 */
import { StyleSheet } from 'react-native';

const InitializingApp = React.memo(({ progress, appVersion }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.progressText}>
      {progress}
    </Text>
    
    <Text style={styles.versionText}>
      {appVersion}
    </Text>
  </View>
));

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF' 
  },
  progressText: {
    marginTop: 10,
    color: '#000000'
  },
  versionText: {
    position: 'absolute',
    bottom: 10,
    fontSize: 10,
    color: '#666666'
  }
});

const App = () => {
  const navigationRef = useRef(null);
  const [initProgress, setInitProgress] = useState('Loading...');
  const [appVersion, setAppVersion] = useState('');

  return (
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <NavigationContainer>
              <NetworkProvider>
                <ThemeProvider>
                  <AccessibilityProvider>
                    <LanguageProvider>
                      <UserProvider>
                        <BlockedUsersProvider>
                          <AppInitializer
                            setInitProgress={setInitProgress}
                            setAppVersion={setAppVersion}
                            navigationRef={navigationRef}
                            initializeServices={initializeServices}
                          />
                          <AppContent initProgress={initProgress} appVersion={appVersion} />
                        </BlockedUsersProvider>
                      </UserProvider>
                    </LanguageProvider>
                  </AccessibilityProvider>
                </ThemeProvider>
              </NetworkProvider>
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
  );
};
  const Stack = createStackNavigator();
  
  // State management
/**
 * AppContent component handles the main content of the app, including user authentication,
 * onboarding, and theme management.
 *
 * @param {Object} props - The component props.
 * @param {string} props.initProgress - The initialization progress message.
 * @param {string} props.appVersion - The current version of the app.
 * @returns {JSX.Element} The rendered component.
 */
const AppContent = ({ initProgress, appVersion }) => {
  // State management
  const { user, userData, setUserData, loading } = useUser();
  const { theme, isDarkMode } = useTheme();
  const { isConnected, isInternetReachable, setOfflineMode } = useNetwork();
  const [localOfflineMode, setLocalOfflineMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { t, i18n: i18nInstance } = useTranslation();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      }
    };
    
    checkOnboarding();
  }, []);

  // Configure RTL layout for appropriate languages
  useEffect(() => {
    const configureRTL = async () => {
      // Arabic and Hebrew are RTL languages
      const isRTL = i18n.language === 'ar' || i18n.language === 'he';
      
      // Only update if the RTL setting needs to change
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
      }
    };
    
    configureRTL();
  }, [i18n.language]);
  
  // Debounce utility function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Monitor network connectivity
  useEffect(() => {
    const handleNetworkChange = debounce((state) => {
      const isOffline = !state.isConnected || !state.isInternetReachable;
      setLocalOfflineMode(isOffline);
      setOfflineMode(isOffline);
      
      // If we're coming back online, refresh user data
      if (state.isConnected && state.isInternetReachable && localOfflineMode && user) {
        refreshUserData(user.uid);
      }
    }, 300); // Adjust the delay as needed

    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    
    // Return cleanup function
    return () => unsubscribe();
  }, [isConnected, isInternetReachable, localOfflineMode, user]);

  // Function to refresh user data - Optimized to load from cache first then update
  const refreshUserData = async (userId) => {
    try {
      if (!userId) return;
      
      // First try to get cached data for immediate UI update
      const cachedData = await AsyncStorage.getItem(`user_${userId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        setLastSyncTime(parsedData._cachedAt);
      }
      
      // Then fetch fresh data from Firestore in background
      if (isConnected && isInternetReachable) {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserData(userData);
          
          // Update local cache
          const timestamp = Date.now();
          await AsyncStorage.setItem(`user_${userId}`, JSON.stringify({
            ...userData,
            _cachedAt: timestamp
          }));
          
          setLastSyncTime(timestamp);
          
          // Log successful sync
          AnalyticsService.logEvent('user_data_synced', {
            success: true,
            timestamp: timestamp
          });
        }
      }
    } catch (error) {
      console.error('Error in refreshUserData:', error);
      setLocalOfflineMode(true);
    }
  };

  const onAuthStateChanged = useCallback(async (authUser) => {
    try {
      setUserData(authUser);

      if (authUser) {
        // Initialize notification service
        await notificationService.initialize(authUser.uid);

        // Identify user for analytics
        AnalyticsService.identifyUser(authUser.uid);

        // Log app launch with user
        AnalyticsService.logEvent('app_launch', {
          logged_in: true,
          app_version: appVersion
        });

        // Try to get cached data first for immediate UI update
        try {
          const cachedUserData = await AsyncStorage.getItem(`user_${authUser.uid}`);
          if (cachedUserData) {
            const parsedData = JSON.parse(cachedUserData);
            setUserData(parsedData);
            setLastSyncTime(parsedData._cachedAt);
          }
        } catch (cacheError) {
          console.error('Error reading cached user data:', cacheError);
        }

        // Securely store auth credentials to enable auto-login
        try {
          // Store authentication state securely
          await Keychain.setGenericPassword(
            authUser.email,
            authUser.uid,
            { service: 'auth_state' }
          );
        } catch (credentialError) {
          console.error('Error storing authentication credentials:', credentialError);
        }

        // Fetch fresh data from Firestore if online
        const networkState = await NetInfo.fetch();
        if (networkState.isConnected && networkState.isInternetReachable) {
          try {
            const userDoc = await firestore().collection('users').doc(authUser.uid).get();
            if (userDoc.exists) {
              const freshUserData = userDoc.data();
              setUserData(freshUserData);

              const timestamp = Date.now();
              // Update cache
              await AsyncStorage.setItem(`user_${authUser.uid}`, JSON.stringify({
                ...freshUserData,
                _cachedAt: timestamp
              }));

              setLastSyncTime(timestamp);
            } else {
              // User document doesn't exist but user is authenticated
              // This might happen if account creation failed midway
              console.warn('User authenticated but no Firestore document exists');

              // Create a basic user document to prevent future issues
              try {
                const userInfo = {
                  uid: authUser.uid,
                  email: authUser.email || '',
                  displayName: authUser.displayName || '',
                  photoURL: authUser.photoURL || '',
                  createdAt: firestore.FieldValue.serverTimestamp(),
                  lastLogin: firestore.FieldValue.serverTimestamp(),
                  // Default settings
                  settings: {
                    notifications: true,
                    darkMode: false,
                    privacyLevel: 'standard',
                    language: i18n.language || 'en', // Store user's language preference
                  },
                  isProfileComplete: false,
                };

                await firestore().collection('users').doc(authUser.uid).set(userInfo);
                setUserData(userInfo);

                const timestamp = Date.now();
                await AsyncStorage.setItem(`user_${authUser.uid}`, JSON.stringify({
                  ...userInfo,
                  _cachedAt: timestamp
                }));

                setLastSyncTime(timestamp);
              } catch (createError) {
                console.error('Error creating user document:', createError);
                setLocalOfflineMode(true);
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setLocalOfflineMode(true);
          }
        } else {
          // We're offline, use cached data only
          setLocalOfflineMode(true);
        }
      } else {
        setUserData(null);
        setLastSyncTime(null);
        setLocalOfflineMode(false);

        // Remove stored credentials on logout
        try {
          await Keychain.resetGenericPassword({ service: 'auth_state' });
        } catch (credentialError) {
          console.error('Error resetting authentication credentials:', credentialError);
        }

        // Reset notifications when user logs out
        await notificationService.cleanup();

        // Reset analytics user
        AnalyticsService.resetUser();

        // Log app launch without user
        AnalyticsService.logEvent('app_launch', {
          logged_in: false,
          app_version: appVersion
        });
      }

      if (initializing) setInitializing(false);
    } catch (error) {
      console.error('Error in onAuthStateChanged:', error);
      setInitializing(false);
    }
  }, [appVersion, initializing]);
  // Keep the first implementation of onAuthStateChanged
    
      // Handle foreground notifications
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case notifee.EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case notifee.EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
        default:
          console.log('Unhandled notification event', type, detail);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    const tryAutoLogin = async () => {
      // Only try auto-login if no user is currently logged in
      if (!user && !loading) {
        try {
          // Check if we have stored credentials
          const credentials = await Keychain.getGenericPassword({ service: 'auth_state' });
          
          if (credentials) {
            const { username: email, password: uid } = credentials;
            
            // Check if we have a stored auth token for faster login
            const authToken = await AsyncStorage.getItem('authToken');
            
            if (authToken) {
              // If we have an auth token, use it to sign in faster
              // This is where you could implement biometric authentication
              console.log('Auto-login with stored credentials');
            }
          }
        } catch (error) {
          console.error('Error retrieving stored credentials:', error);
        }
      }
    };
    
    tryAutoLogin();
    return () => subscriber();
  }, [user, loading, onAuthStateChanged]);
  
  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };
  
  // Apply theme to status bar
  useEffect(() => {
    // Set status bar style based on theme
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
    
    // On Android, also set background color
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.background.paper);
    }
  }, [isDarkMode, theme]);

  // Render loading state
  if (initializing || loading || hasCompletedOnboarding === null) {
    return <InitializingApp progress={initProgress} appVersion={appVersion} />;
  }
  
  // Show onboarding for first-time users
  const OnboardingStack = React.memo(() => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        initialParams={{ onComplete: handleOnboardingComplete }}
      />
    </Stack.Navigator>
  ));

  if (!hasCompletedOnboarding && !user) {
    return <OnboardingStack />;
  }
  
  // Authenticated stack for logged-in users
  if (user) {
    return <AppNavigator />;
  }
  
  const AuthStack = useMemo(() => (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background.default }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
    </Stack.Navigator>
  ), [theme.colors.background.default]);
  return <AuthStack />;
};

export default App;
