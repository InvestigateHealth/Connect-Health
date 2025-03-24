// src/redux/slices/notificationsSlice.js
// Redux slice for managing notifications

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationService } from '../../services/notificationService';

// Utility function to get current date in ISO string format
const getCurrentDateISOString = () => new Date().toISOString();

// Default values
const DEFAULT_LIMIT = 20;

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
  lastFetchedAt: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ userId, limit = DEFAULT_LIMIT, lastDoc = null }, { getState, rejectWithValue }) => {
    try {
      const { notifications } = getState().notifications;
      const newNotifications = await NotificationService.getNotifications(userId, [], limit, lastDoc);
      
      // Combine old and new notifications
      const combinedNotifications = [...notifications, ...newNotifications.notifications];
      
      return { 
        notifications: combinedNotifications, 
        lastDoc: newNotifications.lastDoc 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      await NotificationService.markAsRead(notificationIds);
      return { notificationIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { notifications } = getState().notifications;
      
      // Get only unread notification IDs
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      // Early return if no unread notifications
      if (unreadIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      // Batch process notifications in chunks if there are many
      const BATCH_SIZE = 50;
      const batches = [];
      
      for (let i = 0; i < unreadIds.length; i += BATCH_SIZE) {
        const batch = unreadIds.slice(i, i + BATCH_SIZE);
        batches.push(NotificationService.markAsRead(batch));
      }
      
      // Process all batches concurrently
      await Promise.all(batches);
      
      return { 
        success: true,
        notificationIds: unreadIds,
        count: unreadIds.length
      };
    } catch (error) {
      // Log the error using a logging library (e.g., logService)
      logService.error('Failed to mark notifications as read:', error);
      return rejectWithValue({
        message: error.message || 'Failed to mark notifications as read',
        code: error.code
      });
    }
  }
);

// Create slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.status = 'idle';
      state.error = null;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Add new notifications
        const newNotifications = action.payload.notifications.filter(
          notification => !state.notifications.some(n => n.id === notification.id)
        );
        
        state.notifications.push(...newNotifications);
        state.unreadCount += newNotifications.filter(n => !n.read).length;
        
        // Get current date once
        const currentDateISOString = getCurrentDateISOString();
        state.lastFetchedAt = currentDateISOString;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationIds } = action.payload;
        
        // Update notifications
        state.notifications = state.notifications.map(notification => {
          if (notificationIds.includes(notification.id)) {
            return { ...notification, read: true };
          }
          return notification;
        });
        
        // Update unread count
        state.unreadCount = state.notifications.filter(n => !n.read).length;
      })
  },
});

export const { addNotification, resetNotifications } = notificationsSlice.actions;

export default notificationsSlice.reducer;