// src/screens/FeedScreen.js
// Improved main feed screen with better performance and offline support

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { debounce } from 'lodash';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../theme/ThemeContext';
import { useNetInfo } from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import PostCard from '../components/PostCard';
import { useFocusEffect } from '@react-navigation/native';

// Constants
const POSTS_PER_PAGE = 10;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const FeedScreen = ({ navigation }) => {
  const { user, blockedUsers } = useUser();
  const { isConnected, isInternetReachable = false } = useNetInfo();
  const internetReachable = isInternetReachable !== null ? isInternetReachable : false;
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const lastFetchTime = useRef(0);
  const [shouldReload, setShouldReload] = useState(false);
  
  const isMounted = useRef(true);
  const postsListener = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      clearPostsListener();
      isMounted.current = false;
    };
  }, []);
  // Load posts when component mounts and when blockedUsers changes
  useEffect(() => {
    if (user && blockedUsers !== undefined) {
      setShouldReload(true);
      loadFeed(true);
    }
  }, [user, blockedUsers]);

  // Reload feed when app comes back into focus
  useFocusEffect(
    useCallback(() => {
      // Only reload if we already have posts and not currently loading
      if (shouldReload && posts.length > 0 && !loading && !refreshing) {
        loadFeed(true, true);
        setShouldReload(false);
      }
      return () => {};
    }, [posts.length, loading, refreshing])
  );
  
  useEffect(() => {
    const handleConnectivityChange = async () => {
      // If coming back online and was in offline mode, load fresh data
      if (isConnected && internetReachable && offlineMode) {
        setOfflineMode(false);
        loadFeed(true);
      } 
      // If going offline and have posts, enable offline mode
      else if ((!isConnected || !internetReachable) && posts.length > 0) {
        setOfflineMode(true);
      }
    };

    handleConnectivityChange();
  }, [isConnected, internetReachable, offlineMode, posts.length]);

  // Clear any active listeners
  const clearPostsListener = () => {
    if (postsListener.current) {
      postsListener.current();
      postsListener.current = null;
    }
  };

  // Function to load cached posts
  const loadCachedPosts = async () => {
    try {
      const cachedPostsJson = await AsyncStorage.getItem('cachedFeedPosts');
      const cachedTimestamp = await AsyncStorage.getItem('cachedFeedTimestamp');
      
      if (cachedPostsJson && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        
        // Only use cache if it's not expired
        if (now - timestamp < CACHE_EXPIRY_MS) {
          const cachedPosts = JSON.parse(cachedPostsJson);
          if (cachedPosts && cachedPosts.length > 0 && isMounted.current) {
            setPosts(cachedPosts);
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached posts:', error);
      return false;
    }
  };

  // Function to cache posts
  const cachePosts = async (postsToCache) => {
    try {
      await AsyncStorage.setItem('cachedFeedPosts', JSON.stringify(postsToCache));
      await AsyncStorage.setItem('cachedFeedTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Error caching posts:', error);
    }
  };

  // Main function to load feed posts with pagination
  const loadFeed = async (reset = false, silent = false) => {
    if (!user || (!isConnected && !silent) || (!isConnected && silent)) return;
    if (!user || (!isConnected && !silent)) return;
    
    // Don't show loading indicator for silent refreshes
    if (isMounted.current && !silent) {
      if (reset) {
        // Only show loading spinner on the first load
        if (isFirstLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      } else {
        setLoadingMore(true);
      }
    }

    try {
      // If offline and resetting, try to load from cache
      if (!isConnected && reset) {
        const loadedFromCache = await loadCachedPosts();
        
        if (loadedFromCache) {
          setOfflineMode(true);
          if (isMounted.current) {
            setLoading(false);
            setRefreshing(false);
            setIsFirstLoad(false);
          }
          return;
        }
      }

      // If we're online, fetch from Firestore
      if (isConnected && internetReachable) {
        // Clear any existing listeners if resetting
        if (reset) {
          clearPostsListener();
        }

        // Get user's connections (people they follow)
        const connectionsSnapshot = await firestore()
          .collection('connections')
          .where('userId', '==', user.uid)
          .get();

        // Extract connected user IDs
        let connectedUserIds = connectionsSnapshot.docs
          .map(doc => doc.data().connectedUserId)
          // Filter out blocked users and null values
          .filter(id => id != null && !blockedUsers.includes(id));

        // Add current user's ID to include their own posts
        connectedUserIds.push(user.uid);

        // If no connections and just the user, we'll still query but might get empty results
        let query = firestore()
            .collection('posts');
  
          if (connectedUserIds.length > 0) {
            query = query.where('userId', 'in', connectedUserIds.slice(0, Math.min(connectedUserIds.length, 10)));
          } else {
            query = query.where('userId', '==', 'NO_RESULTS'); // This will return no results
          }
  
          query = query.orderBy('timestamp', 'desc');

        // Apply pagination
        if (!reset && lastVisible) {
          query = query.startAfter(lastVisible);
        }

        // Limit results per page
        query = query.limit(POSTS_PER_PAGE);

        // Execute query
        const snapshot = await query.get();

        // Process results
        if (isMounted.current) {
          const fetchedPosts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data
            };
          });

          // Update state
          if (reset) {
              setPosts(fetchedPosts);
            } else {
              setPosts(prevPosts => {
                return [...prevPosts, ...fetchedPosts];
              });
            }
            setPosts(prevPosts => {
              const allPosts = [...prevPosts, ...fetchedPosts];
              const uniquePosts = Array.from(new Set(allPosts.map(post => post.id)))
                .map(id => allPosts.find(post => post.id === id));
              return uniquePosts;
            });
            setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
          }

        // Update pagination state
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastDoc);
        setHasMorePosts(snapshot.docs.length === POSTS_PER_PAGE);
        setOfflineMode(false);
      } else {
        // We're offline and couldn't load from cache
        setOfflineMode(true);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (isMounted.current && !silent) {
        Alert.alert(
          'Error', 
          'Failed to load feed. Please check your connection and try again.'
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setIsFirstLoad(false);
      }
    }
  };
  const onRefresh = () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Cannot refresh while offline. Please check your connection.');
      return;
    }
    
    if (isMounted.current) {
      loadFeed(true);
    }
  };
  
  const loadMorePosts = () => {
    if (isMounted.current && !loadingMore && hasMorePosts && !offlineMode) {
      loadFeed(false);
    }
  };

  // Navigate to create post screen
  const navigateToCreatePost = () => {
    navigation.navigate('NewPost');
  };

  // Memoized PostCard component
  const MemoizedPostCard = React.memo(({ item }) => (
    <PostCard 
      post={item} 
      navigation={navigation}
      onCommentPress={() => navigation.navigate('Comments', { 
        postId: item.id,
        title: 'Comments'
      })}
      onProfilePress={() => {
        if (item.userId === user?.uid) {
          navigation.navigate('ProfileTab');
        } else {
          navigation.navigate('UserProfile', { 
            userId: item.userId,
            title: item.userFullName
          });
        }
      }}
    />
  ));

  // Render post item
  const renderPostItem = ({ item }) => (
    <MemoizedPostCard item={item} />
  );
  // Render empty state when no posts are available
  const renderEmptyComponent = () => (
    <EmptyComponent
      theme={theme}
      offlineMode={offlineMode}
      navigateToExplore={navigateToExplore}
    />
  );

  const EmptyComponent = React.memo(({ theme, offlineMode, navigateToExplore }) => (
    <View style={styles.emptyContainer}>
      <Icon 
        name="chatbubble-ellipses-outline" 
        size={60} 
        color={theme.colors.gray[300]} 
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        {offlineMode 
          ? 'No cached posts available'
          : 'No posts yet'
        }
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {offlineMode
          ? 'Connect to the internet to view your feed'
          : 'Follow others or share your first post'
        }
      </Text>
      {!offlineMode && (
        <TouchableOpacity
          style={[styles.exploreButton, { backgroundColor: theme.colors.primary.main }]}
          onPress={navigateToExplore}
        >
          <Text style={styles.exploreButtonText}>Find People to Follow</Text>
        </TouchableOpacity>
      )}
    </View>
  ));
  const FooterLoader = React.memo(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  });

  const renderFooterLoader = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  }, [loadingMore, theme]);
  const OfflineBanner = React.memo(() => (
    <View style={[
      styles.offlineBanner,
      { backgroundColor: theme.colors.warning.main }
    ]}>
      <View style={styles.offlineContent}>
        <Icon name="cloud-offline" size={22} color="white" />
        <Text style={styles.offlineText}>
          You're viewing cached content while offline
        </Text>
      </View>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadFeed(true)}
      >
        <Icon name="refresh" size={20} color="white" />
      </TouchableOpacity>
    </View>
  ));

  const renderOfflineBanner = useCallback(() => <OfflineBanner />, [theme, loadFeed]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      {/* Floating action button for creating posts */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          { backgroundColor: theme.colors.primary.main },
          offlineMode && styles.disabledFab
        ]}
        onPress={navigateToCreatePost}
        disabled={offlineMode}
      >
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Offline mode banner */}
      {offlineMode && renderOfflineBanner()}
      
      {loading && isFirstLoad ? (
        <View style={styles.loader}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary.main} 
          />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading your feed...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPostItem}
          contentContainerStyle={
            posts.length === 0 ? { flex: 1 } : styles.contentContainer
          }
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooterLoader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.main]}
              tintColor={theme.colors.primary.main}
              progressBackgroundColor={theme.colors.background.paper}
            />
          }
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          initialNumToRender={5}
          windowSize={10}
          // removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80, // Extra space for FAB
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  disabledFab: {
    opacity: 0.7,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offlineText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default FeedScreen;
