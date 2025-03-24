// src/screens/BlockedUsersScreen.js
// Screen for managing blocked users

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../theme/ThemeContext';
import { BlockService } from '../services/FirebaseService';
import { useNetInfo } from '@react-native-community/netinfo';
import { format } from 'date-fns';
import { ERROR_FETCHING_BLOCKED_USERS, INVALID_DATE } from '../constants/messages';

/**
 * Screen for managing blocked users.
 *
 * @param {object} props - Component props.
 * @param {object} props.navigation - Navigation object provided by React Navigation.
 * @returns {JSX.Element} The rendered component.
 */
const BlockedUsersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, unblockUser, blockedUsers } = useUser();
  const { isConnected } = useNetInfo();
  
const [blockedUserDetails, setBlockedUserDetails] = useState(() => []);
const [loading, setLoading] = useState(true);
const [processingIds, setProcessingIds] = useState([]);
const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation value for item removal
  const itemAnimatedValuesRef = useRef({});
  const [itemAnimatedValuesState, setItemAnimatedValues] = useState({});

  // Initialize animation values for items
  useEffect(() => {
    const newAnimatedValues = {};
    blockedUserDetails.forEach(item => {
      if (!itemAnimatedValuesRef.current[item.id]) {
        newAnimatedValues[item.id] = new Animated.Value(1);
      }
    });

    if (Object.keys(newAnimatedValues).length > 0) {
      itemAnimatedValuesRef.current = { ...itemAnimatedValuesRef.current, ...newAnimatedValues };
    }
  }, [blockedUserDetails, itemAnimatedValuesState]);

  // Fetch blocked user details on component mount
  const fetchBlockedUserDetails = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setErrorMsg(null);
      
      if (!isConnected) {
        setErrorMsg(ERROR_MESSAGES.OFFLINE);
        setLoading(false);
        return;
      }
      
      const details = await BlockService.getBlockedUserDetails(user.uid);
      
      // Sort by most recently blocked
      details.sort((a, b) => {
        if (a.blockInfo?.timestamp && b.blockInfo?.timestamp) {
          return b.blockInfo.timestamp - a.blockInfo.timestamp;
        }
        return 0;
      });
      
      setBlockedUserDetails(details);
    } catch (error) {
      console.error(ERROR_FETCHING_BLOCKED_USERS, error);
      console.error(ERROR_FETCHING_BLOCKED_USERS, error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isConnected]);

  useEffect(() => {
    if (user && blockedUsers) {
      fetchBlockedUserDetails();
    }
  }, [user, blockedUsers, fetchBlockedUserDetails]);

  // Function to handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBlockedUserDetails();
  }, [fetchBlockedUserDetails]);
  // Function to animate item removal
  const animateItemRemoval = useCallback((id, callback) => {
    if (itemAnimatedValuesRef.current[id]) {
      Animated.timing(itemAnimatedValuesRef.current[id], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        if (callback) callback();
      });
    }
  }, [itemAnimatedValuesRef]);

  // Function to handle unblock
  const handleUnblock = useCallback((blockedUserId, userName) => {
    if (!isConnected) {
      Alert.alert('Offline', 'You cannot unblock users while offline.');
      return;
    }
    
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock',
          onPress: async () => {
            try {
              // Add to processing state to show loading indicator
              setProcessingIds(prev => [...prev, blockedUserId]);
              const success = await unblockUser(blockedUserId);
              
              if (success) {
                // Animate removal
                animateItemRemoval(blockedUserId, () => {
                  // Remove from local state after animation completes
                  setBlockedUserDetails(prev => 
                    prev.filter(user => user.id !== blockedUserId)
                  );
                });
                Alert.alert('Success', `${userName} has been unblocked.`);
              } else {
                throw new Error('Failed to unblock user');
              }
            } catch (error) {
              console.error(ERROR_MESSAGES.UNBLOCK_USER_ERROR, error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              // Remove from processing state
              setProcessingIds(prev => prev.filter(id => id !== blockedUserId));
            }
          } 
        }
      ]
    );
    
  }, [isConnected, unblockUser, animateItemRemoval, setProcessingIds]);

  // Function to handle viewing a user's profile
  const handleViewProfile = useCallback((userId) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  // Function to format block timestamp
  const formatBlockDate = useCallback((timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return INVALID_DATE;
    }
  }, []);

  // Render blocked user item
  const renderBlockedUser = useCallback(({ item }) => {
    // Check if this item is being processed
    const isProcessing = processingIds.includes(item.id);
    const userName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown User';
    
    if (!itemAnimatedValuesRef.current[item.id]) {
      itemAnimatedValuesRef.current[item.id] = new Animated.Value(1);
    }
    
    return (
      <Animated.View style={{
        opacity: itemAnimatedValuesRef.current[item.id],
        transform: [{
          translateX: itemAnimatedValuesRef.current[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0]
          })
        }]
      }}>
        <View style={[
          styles.userItem, 
          { backgroundColor: theme.colors.background.card }
        ]}>
          <TouchableOpacity 
            style={styles.userInfo} 
            onPress={() => handleViewProfile(item.id)}
            disabled={isProcessing}
          >
            {item.profileImageURL ? (
              <FastImage
                source={{ uri: item.profileImageURL }}
                defaultSource={require('../assets/default-avatar.png')}
                style={styles.avatar}
              />
            ) : (
              <View style={[
                styles.avatar, 
                styles.defaultAvatar, 
                { backgroundColor: theme.colors.gray[400] }
              ]}>
                <Icon name="person" size={20} color="#FFF" />
              </View>
            )}
            
            <View style={styles.userDetails}>
              <Text style={[
                styles.userName, 
                { color: theme.colors.text.primary }
              ]}>
                {userName}
              </Text>
              
              {item.blockInfo?.reason && (
                <Text style={[
                  styles.blockReason, 
                  { color: theme.colors.text.secondary }
                ]}>
                  Reason: {item.blockInfo.reason}
                </Text>
              )}
              
              {item.blockInfo?.timestamp && (
                <Text style={[
                  styles.blockDate, 
                  { color: theme.colors.text.hint }
                ]}>
                  Blocked on {formatBlockDate(item.blockInfo.timestamp)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.unblockButton, 
              { backgroundColor: theme.colors.error.light },
              isProcessing && styles.disabledButton
            ]}
            onPress={() => handleUnblock(item.id, userName)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.colors.error.dark} />
            ) : (
              <Text style={[
                styles.unblockText, 
                { color: theme.colors.error.dark }
              ]}>
                Unblock
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }, [theme, processingIds, handleUnblock, handleViewProfile, formatBlockDate, setBlockedUserDetails, styles]);

  // Render empty list message
  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon 
        name="shield-checkmark-outline" 
        size={64} 
        color={theme.colors.gray[300]} 
      />
      <Text style={[
        styles.emptyTitle, 
        { color: theme.colors.text.primary }
      ]}>
        No Blocked Users
      </Text>
      <Text style={[
        styles.emptyText, 
        { color: theme.colors.text.secondary }
      ]}>
        You haven't blocked any users yet
      </Text>
    </View>
  ), [theme, styles]);

  // Render error message
  const renderErrorMessage = useCallback(() => (
    <View style={styles.errorContainer}>
      <Icon 
        name="alert-circle-outline" 
        size={64} 
        color={theme.colors.error.main} 
      />
      <Text style={[
        styles.errorTitle, 
        { color: theme.colors.error.main }
      ]}>
        Error
      </Text>
      <Text style={[
        styles.errorText, 
        { color: theme.colors.text.secondary }
      ]}>
        {errorMsg}
      </Text>
      <TouchableOpacity 
        style={[
          styles.retryButton, 
          { backgroundColor: theme.colors.primary.main }
        ]}
        onPress={fetchBlockedUserDetails}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [errorMsg, theme, fetchBlockedUserDetails, styles]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      {!isConnected && <OfflineBanner theme={theme} />}
      {loading && !refreshing ? (
        <LoadingState theme={theme} />
      ) : errorMsg ? (
        <ErrorMessage theme={theme} error={errorMsg} fetchBlockedUserDetails={fetchBlockedUserDetails} />
      ) : (
        <>
          <Header themeProps={theme} blockedUserDetails={blockedUserDetails} />
          <FlatList
            data={blockedUserDetails}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={blockedUserDetails.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary.main]}
                tintColor={theme.colors.primary.main}
              />
            }
          />
        </>
      )}
    </View>
  );
};

/**
 * OfflineBanner component to display a warning when the user is offline.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.theme - Theme object containing color definitions
 */
const OfflineBanner = React.memo(({ theme }) => (
  <View style={[styles.offlineWarning, { backgroundColor: theme.colors.warning.light }]}>
    <Icon name="cloud-offline-outline" size={18} color={theme.colors.warning.dark} />
    <Text style={[styles.offlineWarningText, { color: theme.colors.warning.dark }]}>
      You're offline. Some actions may be unavailable.
    </Text>
  </View>
));

/**
 * LoadingState component to display a loading indicator.
 *
 * @param {object} props - Component props.
 * @param {object} props.theme - Theme object provided by ThemeContext.
 * @returns {JSX.Element} The rendered component.
 */
const LoadingState = React.memo(({ theme }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary.main} />
  </View>
));

/**
 * ErrorMessage component to display an error message and a retry button.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.theme - Theme object containing color definitions
 * @param {string} props.error - Error message to display
 * @param {Function} props.fetchBlockedUserDetails - Function to retry fetching blocked user details
 */
const ErrorMessage = React.memo(({ theme, error, fetchBlockedUserDetails }) => (
  <View style={styles.errorContainer}>
    <Icon 
      name="alert-circle-outline" 
      size={64} 
      color={theme.colors.error.main} 
    />
    <Text style={[styles.errorTitle, { color: theme.colors.error.main }]}>
      Error
    </Text>
    <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
      {error}
    </Text>
    <TouchableOpacity 
      style={[styles.retryButton, { backgroundColor: theme.colors.primary.main }]}
      onPress={fetchBlockedUserDetails}
    >
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

/**
 * Header component to display the header section of the BlockedUsersScreen.
 *
 * @param {object} props - Component props.
 * @param {object} props.themeProps - Theme object provided by ThemeContext.
 * @param {Array} props.blockedUserDetails - Array of blocked user details.
 * @returns {JSX.Element} The rendered component.
 */
const Header = React.memo(({ themeProps, blockedUserDetails }) => (
  <View style={[styles.header, { backgroundColor: themeProps.colors.background.paper, borderBottomColor: themeProps.colors.divider }]}>
    <Text style={[styles.headerTitle, { color: themeProps.colors.text.primary }]}>
      Blocked Users ({blockedUserDetails.length})
    </Text>
    <Text style={[styles.headerSubtitle, { color: themeProps.colors.text.secondary }]}>
      Blocked users cannot interact with you
    </Text>
  </View>
));

OfflineBanner.propTypes = {
  theme: PropTypes.object.isRequired,
};

LoadingState.propTypes = {
  theme: PropTypes.object.isRequired,
};

ErrorMessage.propTypes = {
  theme: PropTypes.object.isRequired,
  error: PropTypes.string.isRequired,
  fetchBlockedUserDetails: PropTypes.func.isRequired,
};

Header.propTypes = {
  themeProps: PropTypes.object.isRequired,
  blockedUserDetails: PropTypes.array.isRequired,
};

BlockedUsersScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
loadingText: {
  fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  blockReason: {
    fontSize: 14,
    marginBottom: 4,
  },
  blockDate: {
    fontSize: 12,
  },
  unblockButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  offlineWarningText: {
    fontSize: 14,
    marginLeft: 8,
  }
});

export default BlockedUsersScreen;