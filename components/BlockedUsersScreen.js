// src/screens/BlockedUsersScreen.js
// Screen to view and manage blocked users

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUser } from '../contexts/UserContext';
import { blockService } from '../services/FirebaseService';

const BlockedUsersScreen = () => {
  const { user, blockedUsers, unblockUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [blockedUserDetails, setBlockedUserDetails] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);

  // Fetch blocked users details when component mounts or blockedUsers list changes
  useEffect(() => {
    fetchBlockedUserDetails();
  }, [user, blockedUsers]);

  // Fetch detailed information about blocked users
  const fetchBlockedUserDetails = async () => {
    if (!user || blockedUsers.length === 0) {
      setBlockedUserDetails([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const details = user?.uid ? await blockService.getBlockedUserDetails(user.uid) : [];
      setBlockedUserDetails(details);
    } catch (error) {
      console.error(`Error fetching blocked user details for user ${user?.uid} with ${blockedUsers.length} blocked users:`, error);
      Alert.alert('Error', 'Failed to load blocked users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle unblocking a user
  const handleUnblock = (blockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${blockedUser.firstName} ${blockedUser.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock', 
          onPress: () => handleUnblockPress(blockedUser)
        }
      ]
    );
  };

  // Handle unblocking a user press
  const handleUnblockPress = async (blockedUser) => {
    try {
      setUnblockingId(blockedUser.id);
      const success = await unblockUser(blockedUser.id);
      
      if (success) {
        // The blockedUsers list in UserContext will be updated automatically,
        // which will trigger a re-fetch of user details
        Alert.alert('Success', `${blockedUser.firstName} ${blockedUser.lastName} has been unblocked.`);
      } else {
        throw new Error('Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
    }
    setUnblockingId(null);
  };

  // Render a blocked user item
  const renderBlockedUser = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        {item.profileImageURL ? (
          <FastImage
            source={{ uri: item.profileImageURL }}
            style={styles.profileImage}
            defaultSource={require('../assets/default-avatar.png')}
          />
        ) : (
          <View style={[styles.profileImage, styles.placeholderProfile]}>
            <Icon name="person" size={20} color="#FFF" />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          
          {item.blockInfo?.reason && (
            <Text style={styles.blockReason}>
              Reason: {item.blockInfo.reason}
            </Text>
          )}
          
          <Text style={styles.blockDate}>
            Blocked on {formatDate(item.blockInfo?.timestamp)}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        disabled={unblockingId === item.id}
      >
        {unblockingId === item.id ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <Text style={styles.unblockButtonText}>Unblock</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shield-checkmark-outline" size={64} color="#B0BEC5" />
      <Text style={styles.emptyTitle}>No Blocked Users</Text>
      <Text style={styles.emptyMessage}>
        You haven't blocked any users yet. When you block someone, they will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <Text style={styles.headerSubtitle}>
          {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading blocked users...</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUserDetails}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBlockedUser}
          contentContainerStyle={blockedUserDetails.length === 0 ? styles.emptyListContainer : null}
          ListEmptyComponent={renderEmptyState()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

import styles from '../styles/BlockedUsersScreenStyles';

export default BlockedUsersScreen;
