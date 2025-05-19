/**
 * Bridge List Component for React Native
 *
 * Provides a component for displaying data in a list with sorting, filtering, and pagination
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView
} from 'react-native';
import { EntityData, FilterDefinition } from '@pubflow/core';
import { useBridgeCrud, UseBridgeCrudOptions } from '../hooks/useBridgeCrud';
import { AdvancedFilter, FilterFieldDefinition } from './AdvancedFilter';

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
   * Whether to show advanced filters
   */
  showAdvancedFilters?: boolean;

  /**
   * Advanced filter fields
   */
  advancedFilterFields?: FilterFieldDefinition[];

  /**
   * Layout configuration
   */
  layout?: {
    /**
     * Advanced filter width percentage (0-100)
     */
    advancedFilterWidth?: number;

    /**
     * Content width percentage (0-100)
     */
    contentWidth?: number;
  };

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
   * Advanced filter component
   */
  advancedFilterComponent?: React.ReactNode;

  /**
   * Text customization
   */
  texts?: {
    /**
     * Search placeholder
     */
    searchPlaceholder?: string;

    /**
     * Offline indicator text
     */
    offlineText?: string;

    /**
     * No items text
     */
    noItemsText?: string;

    /**
     * Loading text
     */
    loadingText?: string;

    /**
     * Previous page button text
     */
    prevPageText?: string;

    /**
     * Next page button text
     */
    nextPageText?: string;

    /**
     * Page info text
     */
    pageInfoText?: string;

    /**
     * Advanced filter texts
     */
    advancedFilter?: {
      title?: string;
      addFilter?: string;
      resetFilters?: string;
      apply?: string;
      cancel?: string;
      field?: string;
      operator?: string;
      value?: string;
    };
  };

  /**
   * Color customization
   */
  colors?: {
    /**
     * Primary color
     */
    primary?: string;

    /**
     * Secondary color
     */
    secondary?: string;

    /**
     * Background color
     */
    background?: string;

    /**
     * Text color
     */
    text?: string;

    /**
     * Border color
     */
    border?: string;

    /**
     * Loading indicator color
     */
    loading?: string;
  };

  /**
   * Whether to show offline indicator
   */
  showOfflineIndicator?: boolean;
}

/**
 * Component for displaying data in a list with sorting, filtering, and pagination
 */
export function BridgeList<T extends EntityData>({
  renderItem,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  showAdvancedFilters = false,
  advancedFilterFields = [],
  layout = { advancedFilterWidth: 30, contentWidth: 70 },
  keyExtractor = (item) => item.id,
  onItemPress,
  style,
  loadingComponent,
  emptyComponent,
  errorComponent,
  paginationComponent,
  searchComponent,
  filterComponent,
  advancedFilterComponent,
  texts = {},
  colors = {},
  showOfflineIndicator = true,
  ...crudOptions
}: BridgeListProps<T>) {
  // Default texts
  const defaultTexts = {
    searchPlaceholder: 'Search...',
    offlineText: 'You are offline. Some features may be limited.',
    noItemsText: 'No items found',
    loadingText: 'Loading...',
    prevPageText: '← Prev',
    nextPageText: 'Next →',
    pageInfoText: 'Page {page} of {totalPages}'
  };

  // Merge default and custom texts
  const finalTexts = { ...defaultTexts, ...texts };

  // Default colors
  const defaultColors = {
    primary: '#007AFF',
    secondary: '#f5f5f5',
    background: '#ffffff',
    text: '#333333',
    border: '#dddddd',
    loading: '#007AFF'
  };

  // Merge default and custom colors
  const finalColors = { ...defaultColors, ...colors };
  // Asegurarse de que searchConfig incluya useRows
  const enhancedCrudOptions = {
    ...crudOptions,
    searchConfig: {
      ...crudOptions.searchConfig,
      useRows: crudOptions.searchConfig?.useRows !== undefined ? crudOptions.searchConfig.useRows : true
    }
  };

  // Use Bridge CRUD hook with raw fetch
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
    addFilter,
    removeFilter,
    resetFilters,
    refresh,
    isOffline
  } = useBridgeCrud<T>(enhancedCrudOptions);

  // Añadir logs para depuración
  console.log('BridgeList - items:', items);
  console.log('BridgeList - items length:', items?.length || 0);
  console.log('BridgeList - loading:', loading);
  console.log('BridgeList - error:', error);

  // Verificar que items sea un array
  const validItems = Array.isArray(items) ? items : [];

  // Render loading state
  if (loading && validItems.length === 0 && loadingComponent) {
    console.log('BridgeList - Rendering loading component');
    return <>{loadingComponent}</>;
  }

  // Render error state
  if (error && errorComponent) {
    console.log('BridgeList - Rendering error component:', error);
    return <>{errorComponent}</>;
  }

  // Render empty state
  if (validItems.length === 0 && !loading && emptyComponent) {
    console.log('BridgeList - Rendering empty component (no items)');
    return <>{emptyComponent}</>;
  }

  // Render item
  const renderListItem = ({ item, index }: { item: T; index: number }) => {
    console.log('BridgeList - renderListItem called with item:', item);

    // Verificar que el item sea válido
    if (!item) {
      console.error('BridgeList - Invalid item received:', item);
      return null;
    }

    // Verificar que el item tenga un id
    if (!item.id) {
      console.error('BridgeList - Item without id received:', item);
      return null;
    }

    const isSelected = selectedItem ? keyExtractor(selectedItem) === keyExtractor(item) : false;

    return (
      <TouchableOpacity
        key={keyExtractor(item)}
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
        <View style={[styles.offlineContainer, { backgroundColor: finalColors.secondary }]}>
          <Text style={[styles.offlineText, { color: finalColors.text }]}>{finalTexts.offlineText}</Text>
        </View>
      )}

      {/* Main content */}
      <View style={styles.mainContainer}>
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Search and Advanced Filter Row */}
          {(showSearch || showAdvancedFilters) && (
            <View style={styles.searchFilterRow}>
              {/* Search */}
              {showSearch && (
                <View style={[
                  styles.searchWrapper,
                  { width: showAdvancedFilters ? '60%' : '100%' }
                ]}>
                  {searchComponent || (
                    <View style={[styles.searchContainer, { backgroundColor: finalColors.secondary }]}>
                      <TextInput
                        style={[
                          styles.searchInput,
                          {
                            borderColor: finalColors.border,
                            backgroundColor: finalColors.background,
                            color: finalColors.text
                          }
                        ]}
                        value={searchTerm}
                        onChangeText={(text) => {
                          // Actualizar el valor del input inmediatamente para feedback visual
                          setSearchTerm(text);

                          // El debounce se maneja en useBridgeCrud
                        }}
                        placeholder={finalTexts.searchPlaceholder}
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {searchTerm ? (
                        <TouchableOpacity
                          style={styles.searchClearButton}
                          onPress={() => setSearchTerm('')}
                        >
                          <Text style={styles.searchClearButtonText}>×</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>
              )}

              {/* Advanced Filter Button */}
              {showAdvancedFilters && (
                <View style={[
                  styles.advancedFilterWrapper,
                  { width: showSearch ? '40%' : '100%' }
                ]}>
                  {advancedFilterComponent || (
                    <AdvancedFilter
                      fields={advancedFilterFields}
                      filters={filters}
                      onAddFilter={(field, operator, value) => {
                        // Primero eliminar cualquier filtro existente con el mismo campo
                        removeFilter(field);

                        // Añadir el nuevo filtro usando la función addFilter del hook
                        addFilter(field, operator, value);
                        setPage(1); // Resetear la página al añadir un filtro
                      }}
                      onRemoveFilter={removeFilter}
                      onResetFilters={resetFilters}
                      texts={texts.advancedFilter}
                      colors={{
                        primary: finalColors.primary,
                        secondary: finalColors.secondary,
                        background: finalColors.background,
                        text: finalColors.text,
                        border: finalColors.border
                      }}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Filters */}
          {showFilters && filters.length > 0 && !showAdvancedFilters && (
            filterComponent || (
              <View style={[styles.filtersContainer, { backgroundColor: finalColors.secondary }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {filters.map((filter, index) => (
                    <View key={index} style={[styles.filterItem, { backgroundColor: finalColors.background }]}>
                      <Text style={[styles.filterText, { color: finalColors.text }]}>
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
            data={validItems}
            renderItem={renderListItem}
            keyExtractor={keyExtractor}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refresh}
                colors={[finalColors.loading]}
              />
            }
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={finalColors.loading} />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: finalColors.text }]}>{finalTexts.noItemsText}</Text>
                </View>
              )
            }
            // Ya no usamos infinite scroll, ahora tenemos paginación con botones
            onEndReached={undefined}
            onEndReachedThreshold={undefined}
            ListFooterComponent={
              loading ? (
                <View style={[styles.footerLoading, { backgroundColor: `${finalColors.secondary}50` }]}>
                  <ActivityIndicator color={finalColors.loading} size="small" />
                  <Text style={[styles.loadingText, { color: finalColors.text }]}>{finalTexts.loadingText}</Text>
                </View>
              ) : null
            }
          />

          {/* Pagination */}
          {showPagination && (
            paginationComponent || (
              <View style={[styles.paginationContainer, { backgroundColor: finalColors.secondary }]}>
                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: finalColors.primary },
                      page <= 1 && [styles.paginationButtonDisabled, { backgroundColor: `${finalColors.primary}50` }]
                    ]}
                    onPress={() => page > 1 && setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <Text style={[
                      styles.paginationButtonText,
                      page <= 1 && styles.paginationButtonTextDisabled
                    ]}>
                      {finalTexts.prevPageText}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.paginationInfo}>
                    <Text style={[styles.paginationText, { color: finalColors.text }]}>
                      {finalTexts.pageInfoText
                        .replace('{page}', String(page))
                        .replace('{totalPages}', String(Math.ceil(totalItems / (enhancedCrudOptions.searchConfig?.initialLimit || 10))))
                      }
                    </Text>
                    <Text style={[styles.paginationSubText, { color: finalColors.text }]}>
                      {totalItems > 0 ? `${items.length} of ${totalItems} items` : 'No items'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: finalColors.primary },
                      !hasMore && [styles.paginationButtonDisabled, { backgroundColor: `${finalColors.primary}50` }]
                    ]}
                    onPress={() => hasMore && setPage(page + 1)}
                    disabled={!hasMore}
                  >
                    <Text style={[
                      styles.paginationButtonText,
                      !hasMore && styles.paginationButtonTextDisabled
                    ]}>
                      {finalTexts.nextPageText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  searchWrapper: {
    paddingRight: 5,
  },
  advancedFilterWrapper: {
    paddingLeft: 5,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingRight: 40, // Espacio para el botón de limpiar
    backgroundColor: '#fff',
  },
  searchClearButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
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
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  paginationContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paginationSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paginationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: '#888',
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


