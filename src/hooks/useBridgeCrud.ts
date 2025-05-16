/**
 * Bridge CRUD Hook for React Native
 * 
 * Provides a hook for CRUD operations using Bridge API
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  BridgeApiService, 
  EntityConfig, 
  EntityData, 
  FilterOperator,
  validateWithSchema
} from '@pubflow/core';
import { z } from 'zod';
import { useBridgeApi } from './useBridgeApi';
import { useBridgeQuery } from './useBridgeQuery';
import { useBridgeMutation, MutationOptions } from './useBridgeMutation';

/**
 * Search configuration
 */
export interface SearchConfig {
  /**
   * Initial search term
   */
  initialSearchTerm?: string;
  
  /**
   * Initial filters
   */
  initialFilters?: Array<{
    field: string;
    operator: FilterOperator | string;
    value: any;
  }>;
  
  /**
   * Initial sort
   */
  initialSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /**
   * Initial page
   */
  initialPage?: number;
  
  /**
   * Initial limit
   */
  initialLimit?: number;
  
  /**
   * Fields to search
   */
  searchFields?: string[];
  
  /**
   * Debounce time in milliseconds
   */
  debounceMs?: number;
  
  /**
   * Whether to search automatically
   */
  autoSearch?: boolean;
}

/**
 * Entity schemas
 */
export interface EntitySchemas<T, U, V> {
  /**
   * Schema for the complete entity
   */
  entity?: z.ZodType<T>;
  
  /**
   * Schema for creating an entity
   */
  create?: z.ZodType<U>;
  
  /**
   * Schema for updating an entity
   */
  update?: z.ZodType<V>;
}

/**
 * Success messages
 */
export interface SuccessMessages {
  /**
   * Success message for create operation
   */
  create?: string;
  
  /**
   * Success message for update operation
   */
  update?: string;
  
  /**
   * Success message for delete operation
   */
  delete?: string;
}

/**
 * Error messages
 */
export interface ErrorMessages {
  /**
   * Error message for create operation
   */
  create?: string;
  
  /**
   * Error message for update operation
   */
  update?: string;
  
  /**
   * Error message for delete operation
   */
  delete?: string;
  
  /**
   * Error message for fetch operation
   */
  fetch?: string;
}

/**
 * Bridge CRUD hook options
 */
export interface UseBridgeCrudOptions<T extends EntityData, U = Partial<T>, V = Partial<T>> {
  /**
   * Entity configuration
   */
  entityConfig: EntityConfig;
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
  
  /**
   * Entity schemas
   */
  schemas?: EntitySchemas<T, U, V>;
  
  /**
   * Search configuration
   */
  searchConfig?: SearchConfig;
  
  /**
   * Success messages
   */
  successMessages?: SuccessMessages;
  
  /**
   * Error messages
   */
  errorMessages?: ErrorMessages;
  
  /**
   * Notification configuration
   */
  notificationConfig?: {
    /**
     * Whether to show notifications automatically
     */
    autoNotify?: boolean;
    
    /**
     * Function to show notifications
     */
    showNotification?: (message: string, type: 'success' | 'error') => void;
  };
  
  /**
   * Offline configuration
   */
  offlineConfig?: {
    /**
     * Whether to queue mutations when offline
     */
    queueMutations?: boolean;
    
    /**
     * Whether to show offline alerts
     */
    showOfflineAlerts?: boolean;
  };
}

/**
 * Bridge CRUD hook result
 */
export interface UseBridgeCrudResult<T extends EntityData> {
  // Data
  items: T[];
  selectedItem: T | null;
  totalItems: number;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Errors
  error: Error | null;
  validationErrors: Record<string, string[]> | null;
  
  // Pagination
  page: number;
  limit: number;
  hasMore: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  
  // Sorting
  orderBy: string | undefined;
  orderDir: 'asc' | 'desc' | undefined;
  setSort: (field: string, direction?: 'asc' | 'desc') => void;
  
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Array<{ field: string; operator: FilterOperator | string; value: any }>;
  addFilter: (field: string, operator: FilterOperator | string, value: any) => void;
  removeFilter: (field: string) => void;
  resetFilters: () => void;
  
  // CRUD operations
  getItem: (id: string) => Promise<T>;
  createItem: (data: Partial<T>, options?: MutationOptions) => Promise<T>;
  updateItem: (id: string, data: Partial<T>, options?: MutationOptions) => Promise<T>;
  deleteItem: (id: string, options?: MutationOptions) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  
  // Selection
  selectItem: (item: T | null) => void;
  
  // Offline
  isOffline: boolean;
  queuedMutations: number;
}

/**
 * Hook for CRUD operations using Bridge API
 * 
 * @param options Hook options
 * @returns CRUD hook result
 */
export function useBridgeCrud<T extends EntityData, U = Partial<T>, V = Partial<T>>(
  options: UseBridgeCrudOptions<T, U, V>
): UseBridgeCrudResult<T> {
  // Extract options
  const { 
    entityConfig, 
    instanceId,
    schemas,
    searchConfig = {},
    successMessages = {},
    errorMessages = {},
    notificationConfig = { autoNotify: true },
    offlineConfig = { queueMutations: true, showOfflineAlerts: true }
  } = options;
  
  // Get Bridge API service
  const service = useBridgeApi<T>(entityConfig, instanceId);
  
  // State
  const [searchTerm, setSearchTerm] = useState(searchConfig.initialSearchTerm || '');
  const [filters, setFilters] = useState(searchConfig.initialFilters || []);
  const [orderBy, setOrderBy] = useState(searchConfig.initialSort?.field);
  const [orderDir, setOrderDir] = useState<'asc' | 'desc' | undefined>(
    searchConfig.initialSort?.direction
  );
  const [page, setPage] = useState(searchConfig.initialPage || 1);
  const [limit, setLimit] = useState(searchConfig.initialLimit || 10);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  
  // Build search params
  const searchParams = {
    page,
    limit,
    orderBy,
    orderDir,
    q: searchTerm,
    filters
  };
  
  // Use query hook for fetching data
  const { 
    data: items, 
    meta, 
    isLoading: loading, 
    error, 
    refetch: refresh,
    isOffline
  } = useBridgeQuery(service, 'search', searchParams);
  
  // Use mutation hooks for CRUD operations
  const { 
    mutate: createMutate, 
    isLoading: creating,
    queuedMutations: createQueuedMutations
  } = useBridgeMutation(service, 'create', {
    successMessage: successMessages.create,
    errorMessage: errorMessages.create,
    showAlerts: notificationConfig.autoNotify,
    queueWhenOffline: offlineConfig.queueMutations
  });
  
  const { 
    mutate: updateMutate, 
    isLoading: updating,
    queuedMutations: updateQueuedMutations
  } = useBridgeMutation(service, 'update', {
    successMessage: successMessages.update,
    errorMessage: errorMessages.update,
    showAlerts: notificationConfig.autoNotify,
    queueWhenOffline: offlineConfig.queueMutations
  });
  
  const { 
    mutate: deleteMutate, 
    isLoading: deleting,
    queuedMutations: deleteQueuedMutations
  } = useBridgeMutation(service, 'delete', {
    successMessage: successMessages.delete,
    errorMessage: errorMessages.delete,
    showAlerts: notificationConfig.autoNotify,
    queueWhenOffline: offlineConfig.queueMutations
  });
  
  // Calculate total queued mutations
  const queuedMutations = createQueuedMutations + updateQueuedMutations + deleteQueuedMutations;
  
  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    if (notificationConfig.showNotification) {
      notificationConfig.showNotification(message, type);
    } else if (notificationConfig.autoNotify) {
      Alert.alert(
        type === 'success' ? 'Success' : 'Error',
        message
      );
    }
  }, [notificationConfig]);
  
  // Validate data against schema
  const validateData = useCallback(<D>(data: D, schema?: z.ZodType<any>): { 
    isValid: boolean; 
    validatedData?: any; 
    errors?: Record<string, string[]> 
  } => {
    if (!schema) {
      return { isValid: true, validatedData: data };
    }
    
    const result = validateWithSchema(schema, data);
    
    if (!result.success) {
      setValidationErrors(result.errors || null);
      return { isValid: false, errors: result.errors };
    }
    
    setValidationErrors(null);
    return { isValid: true, validatedData: result.data };
  }, []);
  
  // CRUD operations
  const getItem = useCallback(async (id: string): Promise<T> => {
    try {
      return await service.getById(id);
    } catch (err: any) {
      if (notificationConfig.autoNotify && errorMessages.fetch) {
        showNotification(errorMessages.fetch, 'error');
      }
      throw err;
    }
  }, [service, notificationConfig.autoNotify, errorMessages.fetch, showNotification]);
  
  const createItem = useCallback(async (data: Partial<T>, options?: MutationOptions): Promise<T> => {
    // Validate data if schema is provided
    if (schemas?.create) {
      const { isValid, validatedData, errors } = validateData(data, schemas.create);
      
      if (!isValid) {
        throw new Error('Validation failed');
      }
      
      data = validatedData;
    }
    
    try {
      const result = await createMutate(data, options);
      
      // Refresh data
      await refresh();
      
      return result;
    } catch (err: any) {
      throw err;
    }
  }, [createMutate, refresh, schemas?.create, validateData]);
  
  const updateItem = useCallback(async (id: string, data: Partial<T>, options?: MutationOptions): Promise<T> => {
    // Validate data if schema is provided
    if (schemas?.update) {
      const { isValid, validatedData, errors } = validateData(data, schemas.update);
      
      if (!isValid) {
        throw new Error('Validation failed');
      }
      
      data = validatedData;
    }
    
    try {
      const result = await updateMutate({ id, data }, options);
      
      // Refresh data
      await refresh();
      
      return result;
    } catch (err: any) {
      throw err;
    }
  }, [updateMutate, refresh, schemas?.update, validateData]);
  
  const deleteItem = useCallback(async (id: string, options?: MutationOptions): Promise<void> => {
    try {
      await deleteMutate(id, options);
      
      // Refresh data
      await refresh();
    } catch (err: any) {
      throw err;
    }
  }, [deleteMutate, refresh]);
  
  // Search functions
  const addFilter = useCallback((field: string, operator: FilterOperator | string, value: any) => {
    setFilters(prev => [
      ...prev.filter(f => f.field !== field),
      { field, operator, value }
    ]);
  }, []);
  
  const removeFilter = useCallback((field: string) => {
    setFilters(prev => prev.filter(f => f.field !== field));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters([]);
    setSearchTerm('');
    setOrderBy(searchConfig.initialSort?.field);
    setOrderDir(searchConfig.initialSort?.direction);
    setPage(1);
  }, [searchConfig.initialSort]);
  
  const setSort = useCallback((field: string, direction?: 'asc' | 'desc') => {
    if (orderBy === field && !direction) {
      // Toggle direction if same field
      setOrderDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDir(direction || 'asc');
    }
  }, [orderBy]);
  
  // Reset page when search term or filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);
  
  return {
    // Data
    items,
    selectedItem,
    totalItems: meta?.total || 0,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Errors
    error,
    validationErrors,
    
    // Pagination
    page,
    limit,
    hasMore: meta?.hasMore || false,
    setPage,
    setLimit,
    
    // Sorting
    orderBy,
    orderDir,
    setSort,
    
    // Search
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    resetFilters,
    
    // CRUD operations
    getItem,
    createItem,
    updateItem,
    deleteItem,
    
    // Refresh
    refresh,
    
    // Selection
    selectItem: setSelectedItem,
    
    // Offline
    isOffline,
    queuedMutations
  };
}
