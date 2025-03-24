// src/redux/slices/networkSlice.js
// Network state management for Redux

import { createSlice } from '@reduxjs/toolkit';
import { OfflineQueue } from '../../services/OfflineService';

const initialState = {
  isOffline: false,
  connectionInfo: null,
  lastUpdated: null,
  offlineQueueLength: 0
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOfflineStatus: (state, action) => {
      const { isOffline, connectionInfo } = action.payload;
      state.isOffline = isOffline;
      state.connectionInfo = connectionInfo;
      state.lastUpdated = new Date().toISOString();
    },
    setOfflineQueueLength: (state, action) => {
      state.offlineQueueLength = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.lastUpdated = new Date().toISOString();
    },
    resetNetworkState: (state) => {
      state.isOffline = initialState.isOffline;
      state.connectionInfo = initialState.connectionInfo;
      state.lastUpdated = new Date().toISOString();
      state.offlineQueueLength = initialState.offlineQueueLength;
    }
  }
});

export const { setOfflineStatus, setOfflineQueueLength, resetNetworkState } = networkSlice.actions;

// Selectors
export const selectIsOffline = (state) => state.network.isOffline;
export const selectConnectionInfo = (state) => state.network.connectionInfo;
export const selectOfflineQueueLength = (state) => state.network.offlineQueueLength;

export const syncOfflineQueue = () => async (dispatch, getState) => {
  dispatch(setOfflineQueueLength(0));
  return true;
};

export const updateOfflineQueueCount = () => async (dispatch) => {
  // Sum all pending operation counts
  const totalCount = await OfflineQueue.getPendingCount();
  dispatch(setOfflineQueueLength(totalCount));
};
export default networkSlice.reducer;
