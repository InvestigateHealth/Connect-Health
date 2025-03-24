// src/redux/slices/notificationsSlice.js
// Notifications state management using Redux Toolkit

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { withRetry } from '../../services/RetryService';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

// Initial state
const initialState = {
  notifications: {},
  unreadCount: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetchedAt: null,
};

// Helper function to update badge count on iOS
const updateBadgeCountOnIOS = (count) => {
  if (Platform.OS === 'ios') {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
};

/**
 * Fetch notifications
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ userId, limit = 20, lastDoc = null }, { rejectWithValue }) => {
    try {
      let query = firestore()
        .collection('notifications')
        .where('recipientId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await withRetry(() => query.get());
      
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : firestore.FieldValue.serverTimestamp(),
        };
      });
      
      return { 
        notifications, 
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Mark notifications as read
 */
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds, { rejectWithValue }) => {
    // Ensure notificationIds is an array for batch processing
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    try {
      // Use batch for efficiency
      const batch = firestore().batch();
      
      ids.forEach(id => {
        const ref = firestore().collection('notifications').doc(id);
        batch.update(ref, { read: true });
      });
      
      await withRetry(() => batch.commit());
      
      return { notificationIds: ids };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Mark all notifications as read
 */
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const snapshot = await withRetry(() => 
        firestore()
          .collection('notifications')
          .where('recipientId', '==', userId)
          .where('read', '==', false)
          .get()
      );
      
      if (snapshot.empty) {
        return { success: true, count: 0 };
      }
      
      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await withRetry(() => batch.commit());
      
      return { 
        success: true, 
        count: snapshot.docs.length,
        notificationIds: snapshot.docs.map(doc => doc.id)
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete notification
 */
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await withRetry(() => 
        firestore().collection('notifications').doc(notificationId).delete()
      );
      
      return { notificationId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Create notification
 */
export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async (notificationData, { rejectWithValue }) => {
    try {
      const ref = await withRetry(() => 
        firestore().collection('notifications').add({
          ...notificationData,
          timestamp: firestore.FieldValue.serverTimestamp(),
          read: false
        })
      );
      
      return { 
        id: ref.id, 
        ...notificationData, 
        timestamp: new Date(),
        read: false
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add a new notification (from push notification)
    addNotification: (state, action) => {
      state.notifications.set(action.payload.id, action.payload);
      state.unreadCount += 1;
      
      // Update badge count on iOS
      updateBadgeCountOnIOS(state.unreadCount);
    },
    
    // Reset notifications state
    resetNotifications: (state) => {
      state.notifications = {};
      state.unreadCount = 0;
      state.status = 'idle';
      state.notifications = new Map();
      state.lastFetchedAt = null;
      
      // Clear badge count on iOS
      updateBadgeCountOnIOS(0);
    },
    
    // Update badge count
    updateBadgeCount: (state) => {
      if (Platform.OS === 'ios') {
        PushNotification.setApplicationIconBadgeNumber(state.unreadCount);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        action.payload.notifications.forEach(notification => {
          state.notifications.set(notification.id, notification);
        });
        state.unreadCount = Object.values(state.notifications).filter(n => !n.read).length;
        
        // Update last fetched timestamp
        state.lastFetchedAt = new Date().toISOString();
        
        // Update badge count on iOS
        if (Platform.OS === 'ios') {
          PushNotification.setApplicationIconBadgeNumber(state.unreadCount);
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        notificationIds.forEach(id => {
          if (state.notifications.has(id)) {
            state.notifications.set(id, { ...state.notifications.get(id), read: true });
          }
        });
        
        // Update unread count
        state.unreadCount = Object.values(state.notifications).filter(n => !n.read).length;
        
        // Update badge count on iOS
        if (Platform.OS === 'ios') {
          PushNotification.setApplicationIconBadgeNumber(state.unreadCount);
        }
      })
        
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        action.payload.notificationIds.forEach(id => {
          if (state.notifications[id]) {
            state.notifications[id] = { ...state.notifications[id], read: true };
          }
        });
        
        // Reset unread count
        state.unreadCount = 0;
        
        // Update badge count on iOS
        if (Platform.OS === 'ios') {
          PushNotification.setApplicationIconBadgeNumber(0);
        }
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        
        const wasUnread = state.notifications.has(notificationId) && !state.notifications.get(notificationId).read;
        
        // Remove the notification
        state.notifications.delete(notificationId);
        if (wasUnread) {
          state.unreadCount -= 1;
          
          // Update badge count on iOS
          if (Platform.OS === 'ios') {
            PushNotification.setApplicationIconBadgeNumber(state.unreadCount);
          }
        }
      })
      
      // Create notification
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.set(action.payload.id, action.payload);
        state.unreadCount += 1;
        
        // Update badge count on iOS
        if (Platform.OS === 'ios') {
          PushNotification.setApplicationIconBadgeNumber(state.unreadCount);
        }
      });
  },
});

// Export actions
export const { 
  addNotification, 
  resetNotifications,
  updateBadgeCount 
} = notificationsSlice.actions;
export const selectAllNotifications = (state) => Array.from(state.notifications.notifications.values());
export const selectNotificationsUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsStatus = (state) => state.notifications.status;
export const selectNotificationsError = (state) => state.notifications.error;

// Export reducer
export default notificationsSlice.reducer;
