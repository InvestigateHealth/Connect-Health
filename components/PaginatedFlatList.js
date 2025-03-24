// src/components/PaginatedFlatList.js
// Reusable component for paginated lists with Firestore

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlatList, 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet,
  RefreshControl
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { theme } from '../theme/theme';

/**
 * PaginatedFlatList component for efficient data loading from Firestore
 * 
 * @param {Object} props - Component props
 * @returns {React.Component} PaginatedFlatList component
 */
const PaginatedFlatList = ({
  // Firestore collection to query
  collection,
  // Array of where conditions: [[field, operator, value], ...]
  where = [],
  // Ordering configuration: { field: 'timestamp', direction: 'desc' }
  orderBy = { field: 'timestamp', direction: 'desc' },
  // Maximum number of items to fetch per page
  limit = 10,
  // Function to render each item
  renderItem,
  // Component to display when list is empty
  ListEmptyComponent,
  // Component to display at the list header
  ListHeaderComponent,
  // Style for the content container
  contentContainerStyle,
  // Optional transform function for items
  transformItem,
  // Dependencies to trigger data refetch
  dependencies = [],
  // Additional props to pass to FlatList
  ...restProps
}) => {
  // State variables
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Default transform function
  const defaultTransform = (doc) => ({
      id: doc.id || doc.data().id,
      ...doc.data(),
      // Convert Firestore timestamps to JS Date objects
      ...(doc.data().timestamp && {
        timestamp: doc.data().timestamp.toDate()
      })
    });

  // Use provided transform function or default
  const transformData = transformItem || defaultTransform;

  /**
   * Fetch initial batch of data
   */
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = firestore().collection(collection);

      // Apply where conditions
      where.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });

      // Apply ordering
      if (orderBy && orderBy.field) {
        query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
      }

      // Apply limit
      query = query.limit(limit);

      const snapshot = await query.get();

      // Transform documents
      const docs = snapshot.docs.map(transformData);

      setData(docs);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === limit);
      setInitialLoad(false);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  // Duplicate useEffect removed

  // Reset when dependencies change

  // Fetch more data (pagination)
  const fetchMoreData = async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      let query = firestore().collection(collection);

      // Apply where conditions
      where.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });

      // Apply ordering
      if (orderBy && orderBy.field) {
        query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
      }

      // Start after last document
      query = query.startAfter(lastDoc);

      // Apply limit
      query = query.limit(limit);

      const snapshot = await query.get();

      // Transform and append new documents
      const newDocs = snapshot.docs.map(transformData);
      setData([...data, ...newDocs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === limit);
    } catch (err) {
      console.error('Error fetching more data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      fetchMoreData();
    }
  };

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, [...dependencies]);

  // Reset when dependencies change
  useEffect(() => {
    if (!initialLoad) {
      setData([]);
      setLastDoc(null);
      setHasMore(true);
      fetchInitialData();
    }
  }, [...dependencies]);

  /**
   * Handle refresh (pull-to-refresh)
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInitialData();
  }, [collection, where, orderBy, limit]);

  /**
   * Render loading footer
   */
  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary.main} />
      </View>
    );
  };

  /**
   * Render error state
   */
  if (error && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.retryText} onPress={fetchInitialData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  /**
   * Render loading state for initial load
   */
  if (loading && !refreshing && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  /**
   * Render FlatList with pagination
   */
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary.main]}
          tintColor={theme.colors.primary.main}
        />
      }
      contentContainerStyle={[
        data.length === 0 && styles.emptyContainer,
        contentContainerStyle
      ]}
      {...restProps}
    />
  );
};

export default PaginatedFlatList;

// Component styles
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginBottom: 8
  },
  retryText: {
    fontSize: 14,
    color: theme.colors.primary.main,
    textAlign: 'center'
  }
});
