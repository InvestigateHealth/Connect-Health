// src/redux/slices/postsSlice.js
// Posts state management using Redux Toolkit

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { firestore } from '@react-native-firebase/firestore';
import { storage } from '@react-native-firebase/storage';
import { withRetry } from '../../services/RetryService';

// Initial state
const initialState = {
  feed: [],
  userPosts: {},  // Object with userId as key and array of posts as value
  currentPost: null,
  comments: {},   // Object with postId as key and array of comments as value
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastDoc: null,
  hasMore: true,
  refreshing: false,
};

/**
 * Fetch feed posts
 */
export const fetchFeedPosts = createAsyncThunk(
  'posts/fetchFeedPosts',
  async ( { userId, blockedUsers = [], limit = 10, lastDoc = null }, { rejectWithValue } ) => {
    try {
      // Attempt to toggle the like status of the post
      // First get current user's connections
      const connectionsSnapshot = await withRetry(() => 
        firestore()
          .collection('connections')
          .where('userId', '==', userId)
          .get()
      );
      
      // Extract connected user IDs
      const connectedUserIds = connectionsSnapshot.docs.map(doc => doc.data().connectedUserId);
      
      // Filter out blocked users
      const filteredIds = connectedUserIds.filter(id => !blockedUsers.includes(id));
      
      // Add current user's ID to include their own posts
      const allUserIds = [...filteredIds, userId];
      
      // Handle Firestore 'in' operator limitation (max 10 values)
      let postsQuery = firestore().collection('posts').orderBy('timestamp', 'desc');
      
      if (allUserIds.length <= 10) {
        // Standard query when <= 10 users
        postsQuery = postsQuery.where('userId', 'in', allUserIds.length > 0 ? allUserIds : [userId]).limit(limit);
      } else {
        // If more than 10 users, query for recent posts and filter client-side
        postsQuery = postsQuery.limit(limit * 3); // Fetch more to account for filtering
      }
      
      // Apply pagination if lastDoc provided
      if (lastDoc) {
        postsQuery = postsQuery.startAfter(lastDoc);
      }
      
      const postsSnapshot = await withRetry(() => postsQuery.get());
      
      let posts;
      if (allUserIds.length <= 10) {
        // No filtering needed
        posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
      } else {
        // Filter to posts from connected users and current user
        posts = postsSnapshot.docs
          .filter(doc => allUserIds.includes(doc.data().userId))
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }))
          .slice(0, limit); // Limit after filtering
      }
      
      const lastVisible = postsSnapshot.docs.length > 0 
        ? postsSnapshot.docs[postsSnapshot.docs.length - 1] 
        : null;
        
      return { 
        posts, 
        lastDoc: lastVisible,
        hasMore: posts.length === limit
      };
    } catch (error) {
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch user's posts
      // Using rejectWithValue to pass the error message to the rejected action payload
      return rejectWithValue(error.message);
export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async ({ userId, limit = 10, lastDoc = null }, { rejectWithValue }) => {
    try {
      let query = firestore()
        .collection('posts')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await withRetry(() => query.get());
      
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
      
      return {
        userId,
        posts,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
        hasMore: posts.length === limit
      };
    } catch (error) {
      // Using rejectWithValue to pass the error message to the rejected action payload
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch post by ID
 */
export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async ({ postId }, { rejectWithValue }) => {
    try {
      const doc = await withRetry(() => 
        firestore().collection('posts').doc(postId).get()
      );
      
      if (!doc.exists) {
        throw new Error('Post not found');
      }
      return { 
        id: doc.id, 
        ...doc.data(), 
        timestamp: doc.data().timestamp?.toDate() || new Date() 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Create a post
 */
export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ postData }, { rejectWithValue }) => {
    try {
      // Extract image/video URI if present
      const { imageUri, videoUri, ...data } = postData;
      let contentUrl = '';
      
      // Upload media if needed
      if (imageUri && data.type === 'image') {
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const extension = filename.split('.').pop();
        const storagePath = `images/${data.userId}_${Date.now()}.${extension}`;
        const storageRef = storage().ref(storagePath);
        
        await withRetry(() => storageRef.putFile(imageUri));
        contentUrl = await withRetry(() => storageRef.getDownloadURL());
      } else if (videoUri && data.type === 'video') {
        const filename = videoUri.substring(videoUri.lastIndexOf('/') + 1);
        const extension = filename.split('.').pop();
        const storagePath = `videos/${data.userId}_${Date.now()}.${extension}`;
        const storageRef = storage().ref(storagePath);
        
        await withRetry(() => storageRef.putFile(videoUri));
        contentUrl = await withRetry(() => storageRef.getDownloadURL());
      } else if (data.type === 'link') {
        contentUrl = data.linkUrl;
      }
      
      // Create post in Firestore
      const postRef = await withRetry(() => 
        firestore().collection('posts').add({
          ...data,
          content: contentUrl,
          timestamp: firestore.FieldValue.serverTimestamp(),
          likeCount: 0,
          commentCount: 0,
          likes: []
        })
      );
      
      return {
        id: postRef.id,
        ...data,
        content: contentUrl,
        timestamp: new Date(),
        likeCount: 0,
        commentCount: 0,
        likes: []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update a post
 */
  export const updatePost = createAsyncThunk(
    'posts/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      await withRetry(() => 
        firestore().collection('posts').doc(postId).update(data)
      );
      
      return { postId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete a post
 */
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      // Get post data to check for media content
      const postDoc = await withRetry(() => 
        firestore().collection('posts').doc(postId).get()
      );
      
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      
      // Delete media from storage if exists
      if (postData.content && (postData.type === 'image' || postData.type === 'video')) {
        try {
          // Extract storage path from URL
          const storageRef = storage().refFromURL(postData.content);
          await withRetry(() => storageRef.delete());
        } catch (storageError) {
          console.error('Error deleting media:', storageError);
          // Continue with post deletion even if media deletion fails
        }
      }
      
      // Get all comments to delete
      const commentsSnapshot = await withRetry(() => 
        firestore()
          .collection('comments')
          .where('postId', '==', postId)
          .get()
      );
      
      // Use a batch to delete post and all comments
      const batch = firestore().batch();
      
      // Delete the post
      batch.delete(firestore().collection('posts').doc(postId));
      
          // Delete all associated comments
          commentsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await withRetry(() => batch.commit());
          return { postId };
        } catch (error) {
          return rejectWithValue(error.message);
        }
      }
    );
    
/**
 * Toggle like on a post
 */
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async ({ postId, userId }, { rejectWithValue }) => {
    try {
      const postRef = firestore().collection('posts').doc(postId);
      
      // Get the current post data
      const post = await withRetry(() => postRef.get());
      
      if (!post.exists) {
        throw new Error('Post not found');
      }
      
      const postData = post.data();
      const likes = postData.likes || [];
      const isLiked = likes.includes(userId);
      
      // Update the post with new like status
      if (isLiked) {
        // Unlike
        await withRetry(() => 
          postRef.update({
            likes: firestore.FieldValue.arrayRemove(userId),
            likeCount: firestore.FieldValue.increment(-1)
          })
        );
      } else {
        // Like
        await withRetry(() => 
          postRef.update({
            likes: firestore.FieldValue.arrayUnion(userId),
            likeCount: firestore.FieldValue.increment(1)
          })
        );
        
        // Create notification if liking someone else's post
        if (postData.userId !== userId) {
          await withRetry(() => 
            firestore().collection('notifications').add({
              type: 'like',
              senderId: userId,
              recipientId: postData.userId,
              postId: postId,
              timestamp: firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
        }
      }
      
      return { postId, userId, isLiked: !isLiked };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch comments for a post
 */
export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async ({ postId, blockedUsers = [], limit = 20, lastDoc = null }, { rejectWithValue }) => {
    try {
      let query = firestore()
        .collection('comments')
        .where('postId', '==', postId)
        .orderBy('timestamp', 'asc')
        .limit(limit);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await withRetry(() => query.get());
      
      // Filter out comments from blocked users
      const comments = snapshot.docs
        .filter(doc => !blockedUsers.includes(doc.data().userId))
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
          editTimestamp: doc.data().editTimestamp?.toDate() || null,
        }));
      
      return {
        postId,
        comments,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
        hasMore: comments.length === limit
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Add a comment to a post
 */
export const addComment = createAsyncThunk(
  'posts/addComment',
  async (commentData, { rejectWithValue }) => {
    try {
      // Create comment
      const commentRef = await withRetry(() => 
        firestore().collection('comments').add({
          ...commentData,
          timestamp: firestore.FieldValue.serverTimestamp(),
          edited: false
        })
      );
      
      // Update post comment count
      await withRetry(() => 
        firestore()
          .collection('posts')
          .doc(commentData.postId)
          .update({
            commentCount: firestore.FieldValue.increment(1)
          })
      );
      
      // Get post owner to send notification
      const postDoc = await withRetry(() => 
        firestore().collection('posts').doc(commentData.postId).get()
      );
      
      if (postDoc.exists) {
        const postData = postDoc.data();
        
        // Create notification if commenting on someone else's post
        if (postData.userId !== commentData.userId) {
          await withRetry(() => 
            firestore().collection('notifications').add({
              type: 'comment',
              senderId: commentData.userId,
              senderName: commentData.userFullName,
              senderProfileImage: commentData.userProfileImageURL,
              recipientId: postData.userId,
              postId: commentData.postId,
              message: 'commented on your post',
              timestamp: firestore.FieldValue.serverTimestamp(),
              read: false
            })
          );
        }
      }
      
      return {
        id: commentRef.id,
        ...commentData,
        timestamp: new Date(),
        edited: false
      };
    } catch (error) {
      // Using rejectWithValue to pass the error message to the rejected action payload
      // This allows the error message to be accessed in the Redux state and displayed in the UI
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update a comment
 */
export const updateComment = createAsyncThunk(
  'posts/updateComment',
  async ({ commentId, text }, { rejectWithValue }) => {
    try {
      await withRetry(() => 
        firestore().collection('comments').doc(commentId).update({
          text,
          edited: true,
          editTimestamp: firestore.FieldValue.serverTimestamp()
        })
      );
      
      return { commentId, text, editTimestamp: new Date() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete a comment
 */
export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ commentId, postId }, { rejectWithValue }) => {
    try {
      // Delete the comment
      await withRetry(() => 
        firestore().collection('comments').doc(commentId).delete()
      );
      
      // Update post comment count
      await withRetry(() => 
        firestore()
          .collection('posts')
          .doc(postId)
          .update({
            commentCount: firestore.FieldValue.increment(-1)
          })
      );
      
      return { commentId, postId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the posts slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Set refreshing state
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    
    // Clear feed posts (for refresh)
    clearFeed: (state) => { 
      state.feed = []; 
      state.lastDoc = null; 
      state.hasMore = true; 
    },
    
    // Clear user posts
    clearUserPosts: (state, action) => {
      const userId = action.payload;
      if (userId) {
        delete state.userPosts[ userId ];
      } else {
        state.userPosts = {};
      }
    },
    
    // Clear current post
    clearCurrentPost: (state) => { 
      state.currentPost = null; 
    },
    
    // Clear comments for specific post
    clearComments: (state, action) => {
      const { postId } = action.payload;
      if (postId) {
        delete state.comments[postId];
      } else {
        state.comments = {};
      }
    },
    
    // Reset error state
    clearError: (state) => { 
      state.error = null; 
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Feed Posts
      .addCase(fetchFeedPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFeedPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.feed = state.refreshing 
          ? action.payload.posts 
          : [...state.feed, ...action.payload.posts];
        state.lastDoc = action.payload.lastDoc;
        state.hasMore = action.payload.hasMore;
        state.refreshing = false;
      })
      .addCase(fetchFeedPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.refreshing = false;
      })
      
      // Fetch User Posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        const { userId, posts } = action.payload;
        
        // Initialize array if needed
        if (!state.userPosts[userId]) {
          state.userPosts[userId] = [];
        }
        
        // Add new posts or replace all if refreshing
        state.userPosts[userId] = state.refreshing
          ? posts
          : [...state.userPosts[userId], ...posts];
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Fetch Post By ID
      .addCase(fetchPostById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Add to feed
        state.feed = [action.payload, ...state.feed];
        
        // Add to user posts if we have them
        const userId = action.payload.userId;
        if (state.userPosts[userId]) {
          state.userPosts[userId] = [action.payload, ...state.userPosts[userId]];
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Update Post
      .addCase(updatePost.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        const { postId, ...updates } = action.payload;
        
        // Update in feed
        state.feed = state.feed.map(post => 
          post.id === postId ? { ...post, ...updates } : post
        );
        
        // Update in userPosts
        for (const userId in state.userPosts) {
          state.userPosts[userId] = state.userPosts[userId].map(post => 
            post.id === postId ? { ...post, ...updates } : post
          );
        }
        
        // Update currentPost if it's the same post
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost = { ...state.currentPost, ...updates };
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Delete Post
      .addCase(deletePost.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        const { postId } = action.payload;
        
        // Remove from feed
        state.feed = state.feed.filter(post => post.id !== postId);
        
        // Remove from userPosts
        for (const userId in state.userPosts) {
          state.userPosts[userId] = state.userPosts[userId].filter(post => post.id !== postId);
        }
        
        // Clear currentPost if it's the same post
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost = null;
        }
        
        // Clear comments for the deleted post
        delete state.comments[postId];
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Toggle Like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, userId, isLiked } = action.payload;
        
        // Helper function to update a post's like status
        const updatePostLike = (post) => {
          if (post.id !== postId) return post;
          
          const updatedLikes = isLiked
            ? [...(post.likes || []), userId]
            : (post.likes || []).filter(id => id !== userId);
          
          const updatedLikeCount = isLiked
            ? (post.likeCount || 0) + 1
            : Math.max(0, (post.likeCount || 0) - 1);
          
          return {
            ...post,
            likes: updatedLikes,
            likeCount: updatedLikeCount
          };
        };
        
        // Update in feed
        state.feed = state.feed.map(updatePostLike);
        
        // Update in userPosts
        for (const uid in state.userPosts) {
          state.userPosts[uid] = state.userPosts[uid].map(updatePostLike);
        }
        
        // Update currentPost if it's the same post
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost = updatePostLike(state.currentPost);
        }
      })
      
      // Fetch Comments
      .addCase(fetchComments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        const { postId, comments } = action.payload;
        
        // Initialize array if needed
        if (!state.comments[postId]) {
          state.comments[postId] = [];
        }
        
        // Add new comments (assume no duplicates for simplicity)
        state.comments[postId] = [...state.comments[postId], ...comments];
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Add Comment
      .addCase(addComment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        const { postId } = action.payload;
        
        // Add to comments
        if (!state.comments[postId]) {
          state.comments[postId] = [];
        }
        state.comments[postId].push(action.payload);
        
        // Update comment count in posts
        const updateCommentCount = (post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            commentCount: (post.commentCount || 0) + 1
          };
        };
        
        // Update in feed
        state.feed = state.feed.map(updateCommentCount);
        
        // Update in userPosts
        for (const userId in state.userPosts) {
          state.userPosts[userId] = state.userPosts[userId].map(updateCommentCount);
        }
        
        // Update currentPost if it's the same post
        if (state.currentPost && state.currentPost.id === postId) {
          state.currentPost = updateCommentCount(state.currentPost);
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Update Comment
      .addCase(updateComment.fulfilled, (state, action) => {
        const { commentId, text, editTimestamp } = action.payload;
        
        // Update comment in all posts
        for (const postId in state.comments) {
          state.comments[postId] = state.comments[postId].map(comment => {
            if (comment.id !== commentId) return comment;
            
            return {
              ...comment,
              text,
              edited: true,
              editTimestamp
            };
          });
        }
      })
      
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { commentId, postId } = action.payload;
        
        // Remove comment
        if (state.comments[postId]) {
          state.comments[postId] = state.comments[postId].filter(
            comment => comment.id !== commentId
          );
        }
        
        // Update comment count in posts
        const updateCommentCount = (post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            commentCount: Math.max(0, (post.commentCount || 0) - 1)
          };
        };
        
        // Update in feed
        state.feed = state.feed.map(updateCommentCount);
        
        // Update in userPosts
        for (const userId in state.userPosts) {
          state.userPosts[userId] = state.userPosts[userId].map(updateCommentCount);
        }
        
                    // Update currentPost if it's the same post
                    if (state.currentPost && state.currentPost.id === postId) {
                      state.currentPost = updateCommentCount(state.currentPost);
                    }
                  });
            }
          });
      
      export default postsSlice.reducer;