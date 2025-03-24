// src/components/PostCard.js
// Updated with block user option

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { format, formatDistanceToNow } from 'date-fns';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinkPreview from './LinkPreview';
import { useUser } from '../contexts/UserContext';
import BlockUserModal from './BlockUserModal';

const formatTimestamp = (timestamp) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  
  // If less than 24 hours ago, show relative time
  if (now - postDate < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(postDate, { addSuffix: true });
  }
  
  // Otherwise show the date
  return format(postDate, 'MMM d, yyyy');
};

const PostCard = ({ post, navigation, onCommentPress, onProfilePress }) => {
  const { isUserBlocked } = useUser();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes?.includes(auth().currentUser.uid) || false);
  }, [post.likes]);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [userIsPostAuthor, setUserIsPostAuthor] = useState(false);

  const handleLikeToggle = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to like a post');
      return;
    }
    const postRef = firestore().collection('posts').doc(post.id);
    const currentUserUid = currentUser.uid;
    
    try {
      await firestore().runTransaction(async transaction => {
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists) {
          throw new Error('Post does not exist!');
        }
        
        const postData = postDoc.data();
        const likes = postData.likes || [];
        const userLiked = likes.includes(currentUserUid);
        
        if (userLiked) {
          // Remove like
          transaction.update(postRef, {
            likes: firestore.FieldValue.arrayRemove(currentUserUid),
            likeCount: firestore.FieldValue.increment(-1)
          });
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        } else {
          // Add like
          transaction.update(postRef, {
            likes: firestore.FieldValue.arrayUnion(currentUserUid),
            likeCount: firestore.FieldValue.increment(1)
          });
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status. Please try again.');
    }
  };

  const handleSharePost = () => {
    // Implement share functionality
    // This would typically use the Share API from react-native
    Alert.alert('Share', 'Sharing functionality would be implemented here');
  };

  const handleReportPost = () => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            // Add report to database
            try {
              firestore().collection('reports').add({
                postId: post.id,
                reportedBy: auth().currentUser.uid,
                timestamp: firestore.FieldValue.serverTimestamp(),
                resolved: false
              });
              
              Alert.alert('Report Submitted', 'Thank you for your report. We will review this post.');
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Error', 'Failed to submit report. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleBlockSuccess = () => {
    Alert.alert(
      'User Blocked',
      `You have blocked ${post.userFullName}. Their posts will no longer appear in your feed.`
    );
  };

  // Use react-native-popup-menu instead of ActionSheetIOS for cross-platform
  const renderMoreOptions = () => (
    <Menu>
      <MenuTrigger>
        <Icon name="ellipsis-horizontal" size={20} color="#546E7A" />
      </MenuTrigger>
      <MenuOptions customStyles={{
        optionsContainer: styles.menuOptions,
      }}>
        <MenuOption onSelect={handleSharePost} customStyles={{
          optionWrapper: styles.menuOption,
        }}>
          <Icon name="share-outline" size={20} color="#546E7A" style={styles.menuIcon} />
          <Text style={styles.menuText}>Share</Text>
        </MenuOption>

        {!userIsPostAuthor && (
          <>
            <MenuOption onSelect={handleReportPost} customStyles={{
              optionWrapper: styles.menuOption,
            }}>
              <Icon name="flag-outline" size={20} color="#FF9800" style={styles.menuIcon} />
              <Text style={styles.menuText}>Report Post</Text>
            </MenuOption>
            
            <MenuOption onSelect={handleBlockUser} customStyles={{
              optionWrapper: styles.menuOption,
            }}>
              <Icon name="shield-outline" size={20} color="#F44336" style={styles.menuIcon} />
              <Text style={[styles.menuText, styles.dangerText]}>Block User</Text>
            </MenuOption>
          </>
        )}
        
        {userIsPostAuthor && (
          <MenuOption onSelect={handleDeletePost} customStyles={{
            optionWrapper: styles.menuOption,
          }}>
            <Icon name="trash-outline" size={20} color="#F44336" style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.dangerText]}>Delete Post</Text>
          </MenuOption>
        )}
      </MenuOptions>
    </Menu>
  );
  const handleBlockUser = () => {
    try {
      setBlockModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to open block user modal. Please try again.');
    }
  };
  const handleDeletePost = () => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to delete a post');
        return;
      }
  
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the post
                await firestore().collection('posts').doc(post.id).delete();
                
                // Delete associated comments
                const commentsSnapshot = await firestore()
                  .collection('comments')
                  .where('postId', '==', post.id)
                  .get();
                
                const batch = firestore().batch();
                commentsSnapshot.docs.forEach(doc => {
                  batch.delete(doc.ref);
                });
                
                await batch.commit();
                
                Alert.alert('Success', 'Post deleted successfully');
              } catch (error) {
                console.error('Error deleting post:', error);
                Alert.alert('Error', 'Failed to delete post. Please try again.');
              }
            }
          }
        ]
      );
  };

  const ImageContent = ({ uri }) => (
    <FastImage
      source={{ uri }}
      style={styles.postImage}
      resizeMode={FastImage.resizeMode.cover}
    />
  );

  const VideoContent = ({ uri, thumbnailUrl }) => (
    <View style={styles.videoContainer}>
      <FastImage
        source={{ uri: thumbnailUrl || uri }}
        style={styles.postImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.playButtonOverlay}>
        <Icon name="play-circle" size={60} color="rgba(255, 255, 255, 0.8)" />
      </View>
    </View>
  );

  const LinkContent = ({ url }) => <LinkPreview url={url} />;

  // Render post content based on type
  const renderPostContent = () => {
    switch (post.type) {
      case 'image':
        return <ImageContent uri={post.content} />;
      case 'video':
        return <VideoContent uri={post.content} thumbnailUrl={post.thumbnailUrl} />;
      case 'link':
        return <LinkContent url={post.content} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onProfilePress}>
          {post.userProfileImageURL ? (
            <FastImage
              source={{ uri: post.userProfileImageURL }}
              style={styles.profileImage}
              defaultSource={require('../assets/default-avatar.png')}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholderProfile]}>
              <Icon name="person" size={20} color="#FFF" />
            </View>
          )}
          <View>
            <Text style={styles.userName}>{post.userFullName}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {renderMoreOptions()}
        </View>
      </View>
      
      {post.caption && (
        <Text style={styles.caption}>{post.caption}</Text>
      )}
      
      {post.content && renderPostContent()}
      
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Icon name="heart" size={16} color="#F44336" />
          <Text style={styles.statText}>{likeCount} likes</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="chatbubble" size={16} color="#2196F3" />
          <Text style={styles.statText}>{post.commentCount || 0} comments</Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLikeToggle}
        >
          <Icon 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#F44336" : "#546E7A"} 
          />
          <Text style={[
            styles.actionText,
            isLiked && { color: "#F44336" }
          ]}>
            Like
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onCommentPress}
        >
          <Icon name="chatbubble-outline" size={24} color="#546E7A" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSharePost}
        >
          <Icon name="share-outline" size={24} color="#546E7A" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <BlockUserModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        userToBlock={post.userId && post.userFullName ? { id: post.userId, name: post.userFullName } : null}
        onSuccess={handleBlockSuccess}
      />
    </View>
  );
};

import styles from '../styles/PostCardStyles';

export default PostCard;