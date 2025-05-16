/**
 * Bridge List Component for React Native
 * 
 * Provides a component for displaying data in a list with sorting, filtering, and pagination
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { EntityData, FilterOperator } from '@pubflow/core';
import { useBridgeCrud, UseBridgeCrudOptions } from '../hooks/useBridgeCrud';

/**
 * Item renderer props
 */
export interface ItemRendererProps<T> {
  /**
   * Item data
   */
  item: T;
  
  /**
   * Item index
   */
  index: number;
  
  /**
   * Whether the item is selected
   */
  isSelected: boolean;
  
  /**
   * Function to select the item
   */
  onSelect: () => void;
}

/**
 * Bridge List props
 */
export interface BridgeListProps<T extends EntityData> extends UseBridgeCrudOptions<T> {
  /**
   * Item renderer
   */
  renderItem: (props: ItemRendererProps<T>) => React.ReactNode;
  
  /**
   * Whether to show pagination
   */
  showPagination?: boolean;
  
  /**
   * Whether to show search
   */
  showSearch?: boolean;
  
  /**
   * Whether to show filters
   */
  showFilters?: boolean;
  
  /**
   * Item key function
   */
  keyExtractor?: (item: T) => string;
  
  /**
   * Item press handler
   */
  onItemPress?: (item: T) => void;
  
  /**
   * List class name
   */
  style?: any;
  
  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Empty component
   */
  emptyComponent?: React.ReactNode;
  
  /**
   * Error component
   */
  errorComponent?: React.ReactNode;
  
  /**
   * Pagination component
   */
  paginationComponent?: React.ReactNode;
  
  /**
   * Search component
   */
  searchComponent?: React.ReactNode;
  
  /**
   * Filter component
   */
  filterComponent?: React.ReactNode;
  
  /**
   * Search placeholder
   */
  searchPlaceholder?: string;
  
  /**
   * Loading indicator color
   */
  loadingColor?: string;
  
  /**
   * Whether to show offline indicator
   */
  showOfflineIndicator?: boolean;
  
  /**
   * Offline indicator text
   */
  offlineText?: string;
}

/**
 * Component for displaying data in a list with sorting, filtering, and pagination
 */
export function BridgeList<T extends EntityData>({
  renderItem,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  keyExtractor = (item) => item.id,
  onItemPress,
  style,
  loadingComponent,
  emptyComponent,
  errorComponent,
  paginationComponent,
  searchComponent,
  filterComponent,
  searchPlaceholder = 'Search...',
  loadingColor = '#007AFF',
  showOfflineIndicator = true,
  offlineText = 'You are offline. Some features may be limited.',
  ...crudOptions
}: BridgeListProps<T>) {
  // Use Bridge CRUD hook
  const {
    items,
    selectedItem,
    selectItem,
    loading,
    error,
    page,
    limit,
    hasMore,
    totalItems,
    setPage,
    searchTerm,
    setSearchTerm,
    filters,
    removeFilter,
    resetFilters,
    refresh,
    isOffline
  } = useBridgeCrud<T>(crudOptions);
  
  // Render loading state
  if (loading && items.length === 0 && loadingComponent) {
    return <>{loadingComponent}</>;
  }
  
  // Render error state
  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }
  
  // Render empty state
  if (items.length === 0 && !loading && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  
  // Render item
  const renderListItem = ({ item, index }: { item: T; index: number }) => {
    const isSelected = selectedItem ? keyExtractor(selectedItem) === keyExtractor(item) : false;
    
    return (
      <TouchableOpacity
        onPress={() => {
          selectItem(item);
          if (onItemPress) {
            onItemPress(item);
          }
        }}
      >
        {renderItem({
          item,
          index,
          isSelected,
          onSelect: () => selectItem(item)
        })}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Offline Indicator */}
      {isOffline && showOfflineIndicator && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>{offlineText}</Text>
        </View>
      )}
      
      {/* Search */}
      {showSearch && (
        searchComponent || (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={searchPlaceholder}
              placeholderTextColor="#999"
            />
          </View>
        )
      )}
      
      {/* Filters */}
      {showFilters && filters.length > 0 && (
        filterComponent || (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter, index) => (
                <View key={index} style={styles.filterItem}>
                  <Text style={styles.filterText}>
                    {filter.field}: {String(filter.value)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFilter(filter.field)}
                    style={styles.filterRemove}
                  >
                    <Text style={styles.filterRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {filters.length > 0 && (
                <TouchableOpacity
                  onPress={resetFilters}
                  style={styles.resetFilters}
                >
                  <Text style={styles.resetFiltersText}>Reset</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )
      )}
      
      {/* List */}
      <FlatList
        data={items}
        renderItem={renderListItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={[loadingColor]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={loadingColor} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          )
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            setPage(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && items.length > 0 ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={loadingColor} />
            </View>
          ) : null
        }
      />
      
      {/* Pagination */}
      {showPagination && (
        paginationComponent || (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationText}>
              {totalItems > 0 ? `${items.length} of ${totalItems} items` : 'No items'}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  filterText: {
    fontSize: 12,
  },
  filterRemove: {
    marginLeft: 5,
  },
  filterRemoveText: {
    fontSize: 16,
    color: '#999',
  },
  resetFilters: {
    backgroundColor: '#f8d7da',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resetFiltersText: {
    fontSize: 12,
    color: '#721c24',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  footerLoading: {
    padding: 10,
    alignItems: 'center',
  },
  paginationContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
  },
  offlineContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#721c24',
    fontSize: 12,
  },
});

// Import ScrollView here to avoid circular dependency
import { ScrollView } from 'react-native';
