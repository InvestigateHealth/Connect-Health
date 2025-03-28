// src/components/UserListItem.js
// Component for displaying a user in a list with connection status

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import styles from './UserListItemStyles';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const UserListItem = ({ user, currentUserConditions, onPress }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isMounted = useRef(true);
    
    const checkStatus = async () => {
      try {
        const connectionDoc = await firestore()
          .collection('connections')
          .where('userId', '==', auth().currentUser.uid)
          .where('connectedUserId', '==', user.id)
          .get();
        
        if (isMounted.current) {
          setIsFollowing(!connectionDoc.empty);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking following status:', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    checkStatus();
    return () => {
      isMounted.current = false;
    };
  }, [user.id]);

  const toggleFollow = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const connectionRef = firestore().collection('connections');

      if (isFollowing) {
        // Find and delete the connection
        const connectionDoc = await connectionRef
          .where('userId', '==', auth().currentUser.uid)
          .where('connectedUserId', '==', user.id)
          .get();

        if (!connectionDoc.empty) {
          await connectionDoc.docs[0].ref.delete();
        }
      } else {
        // Create a new connection
        await connectionRef.add({
          userId: auth().currentUser.uid,
          connectedUserId: user.id,
          timestamp: firestore.FieldValue.serverTimestamp()
        });
      }

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sharedConditions = getSharedConditions(user, currentUserConditions);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <UserProfile user={user} sharedConditions={sharedConditions} />
      <FollowButton
        isFollowing={isFollowing}
        loading={loading}
        toggleFollow={toggleFollow}
      />
    </TouchableOpacity>
  );
};

const getSharedConditions = (user, currentUserConditions) => {
  if (!user.medicalConditions || !currentUserConditions) return [];

  return user.medicalConditions.filter(condition =>
    currentUserConditions.includes(condition)
  );
};

const UserProfile = ({ user, sharedConditions }) => (
  <View style={styles.leftSection}>
    {user.profileImageURL ? (
      <FastImage
        style={styles.profileImage}
        source={{ uri: user.profileImageURL }}
        resizeMode={FastImage.resizeMode.cover}
      />
    ) : (
      <View style={[styles.profileImage, styles.placeholderProfile]}>
        <Icon name="person" size={20} color="#FFF" />
      </View>
    )}

    <View style={styles.userInfo}>
      <Text style={styles.userName}>
        {user.firstName} {user.lastName}
      </Text>

      {sharedConditions.length > 0 && (
        <View style={styles.sharedContainer}>
          <Icon name="fitness-outline" size={14} color="#2196F3" />
          <Text style={styles.sharedText}>
            {sharedConditions.length === 1
              ? `Shares ${sharedConditions[0]}`
              : `Shares ${sharedConditions.length} conditions`}
          </Text>
        </View>
      )}

      <View style={styles.conditionsContainer}>
        {user.medicalConditions?.slice(0, 2).map((condition, index) => (
          <View key={index} style={styles.conditionTag}>
            <Text style={styles.conditionText} numberOfLines={1}>
              {condition}
            </Text>
          </View>
        ))}

        {user.medicalConditions?.length > 2 && (
          <Text style={styles.moreConditions}>
            +{user.medicalConditions.length - 2}
          </Text>
        )}
      </View>
    </View>
  </View>
);

const FollowButton = ({ isFollowing, loading, toggleFollow }) => (
  <TouchableOpacity
    style={[
      styles.followButton,
      isFollowing && styles.followingButton
    ]}
    onPress={toggleFollow}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator size="small" color={isFollowing ? "#546E7A" : "#FFF"} />
    ) : (
      <Text style={[
        styles.followButtonText,
        isFollowing && styles.followingButtonText
      ]}>
        {isFollowing ? 'Following' : 'Follow'}
      </Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderProfile: {
    backgroundColor: '#90A4AE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263238',
    marginBottom: 2,
  },
  sharedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sharedText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  conditionsContainer: {
  }
});
