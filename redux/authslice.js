// src/redux/slices/authSlice.js
// Authentication state management using Redux Toolkit

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService, UserService } from '../../services/FirebaseService';
import { withRetry } from '../../services/RetryService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  authChecked: false
};

/**
 * Check existing auth state
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // This is handled by an auth state listener, but we need
      // to dispatch this action to set authChecked to true
      const user = FirebaseService.getCurrentUser();
      return { user };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Sign in with email and password
 */
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await withRetry(() => 
        FirebaseService.signIn(email, password),
        { maxRetries: 3 }
      );
      
      // Save user login state
      await AsyncStorage.setItem('userLoggedIn', 'true');
      
      return { user: userCredential.user };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Sign up with email and password
 */
export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, userData }, { rejectWithValue }) => {
    try {
      const userCredential = await withRetry(() => 
        FirebaseService.signUp(email, password),
        { maxRetries: 2 }
      );
      
      // Save user login state
      await AsyncStorage.setItem('userLoggedIn', 'true');
      
      return { user: userCredential.user, userData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Sign out
 */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await FirebaseService.signOut();
      
      // Clear user login state
      await AsyncStorage.removeItem('userLoggedIn');
      
      // Clear any cached auth data
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userProfile',
        'fcmToken'
      ]);
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Send password reset email
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await withRetry(() => 
        FirebaseService.resetPassword(email),
        { maxRetries: 3 }
      );
      return { success: true, email };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update user profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      // Implement update profile logic
      // UserService is now imported statically at the top of the file
      await UserService.updateProfile(userId, data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete user account
 */
export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Implement account deletion logic
      await user.delete();
      // Example: await user.delete();
      // Ensure that any associated data in your database is also cleaned up
      // You might need to call additional services or APIs to remove user data
      
      // Clear all stored data
      await AsyncStorage.clear();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set current user (typically called from auth state listener)
    setUser: (state, action) => {
      const user = action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
      state.authChecked = true;
      state.status = 'idle';
      state.error = null;
    },
    
    // Set user profile
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    
    // Clear any error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset auth state
    resetAuthState: (state) => {
      return {
        ...initialState,
        authChecked: true
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.status = 'idle';
        state.authChecked = true;
        state.user = action.payload?.user || null;
        state.isAuthenticated = !!action.payload?.user;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.status = 'idle';
        state.authChecked = true;
        state.user = null;
        state.isAuthenticated = false;
      })
      
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
        state.authChecked = true;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        } else {
          state.profile = action.payload;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
        state.authChecked = true;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  setUser, 
  setProfile, 
  clearError, 
  resetAuthState 
} = authSlice.actions;

// Export selectors
export const selectUser = (state) => state.auth.user;
export const selectProfile = (state) => state.auth.profile;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthChecked = (state) => state.auth.authChecked;

// Export reducer
export default authSlice.reducer;
