/**
 * Bridge Query Hook for React Native
 *
 * Provides a hook for querying data using Bridge API with SWR
 */

import { useState, useEffect, useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import {
  BridgeApiService,
  EntityData,
  PaginatedResponse,
  SearchParams,
  QueryParams as CoreQueryParams
} from '@pubflow/core';
import { NetInfo } from '../utils/netInfo';
import { BridgeApiRawService } from '../services/BridgeApiRawService';

/**
 * Bridge query types
 */
type QueryType = 'list' | 'get' | 'search';

/**
 * Bridge query parameters
 */
type BridgeQueryParams<T> =
  T extends 'list' ? CoreQueryParams :
  T extends 'get' ? { id: string; params?: CoreQueryParams } :
  T extends 'search' ? SearchParams :
  never;

/**
 * Bridge query result
 */
type QueryResult<T extends EntityData, Q extends QueryType> =
  Q extends 'list' ? PaginatedResponse<T> :
  Q extends 'get' ? T :
  Q extends 'search' ? PaginatedResponse<T> :
  never;

/**
 * Bridge query hook result
 */
export interface UseBridgeQueryResult<T extends EntityData, Q extends QueryType> {
  data: Q extends 'list' | 'search' ? T[] : T | null;
  meta: Q extends 'list' | 'search' ? { page: number; limit: number; total: number; hasMore: boolean } : null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
}

/**
 * Hook for querying data using Bridge API with SWR
 *
 * @param service Bridge API service
 * @param type Query type
 * @param params Query parameters
 * @param config SWR configuration
 * @param useRawFetch Whether to use direct fetch instead of the API client
 * @returns Query result
 */
export function useBridgeQuery<T extends EntityData, Q extends QueryType>(
  service: BridgeApiService<T>,
  type: Q,
  params: BridgeQueryParams<Q>,
  config?: SWRConfiguration,
  useRawFetch: boolean = true
): UseBridgeQueryResult<T, Q> {
  // Track network state
  const [isOffline, setIsOffline] = useState(false);

  // Create a unique key for SWR
  const key = JSON.stringify({ service, type, params });

  // Create a raw service if useRawFetch is true
  const rawService = useRawFetch ? new BridgeApiRawService<T>(
    {
      endpoint: type === 'search' ? (params as SearchParams).entity || 'users' : 'users',
      customEndpoints: {}
    },
    'https://api.pml.edu.do'
  ) : null;

  // Define fetcher function
  const fetcher = useCallback(async () => {
    // Check network connectivity
    const isConnected = await NetInfo.isConnected();
    setIsOffline(!isConnected);

    if (!isConnected) {
      throw new Error('No internet connection');
    }

    let result;
    try {
      // Use raw service if available, otherwise use the regular service
      const apiService = useRawFetch && rawService ? rawService : service;

      console.log('useBridgeQuery - Using', useRawFetch ? 'raw fetch' : 'regular service');

      switch (type) {
        case 'list':
          result = await apiService.getList(params as CoreQueryParams);
          console.log('useBridgeQuery - list result:', result);
          return result;
        case 'get':
          const { id, params: getParams } = params as { id: string; params?: CoreQueryParams };
          result = await apiService.getById(id, getParams);
          console.log('useBridgeQuery - get result:', result);
          return result;
        case 'search':
          result = await apiService.search(params as SearchParams);
          console.log('useBridgeQuery - search result:', result);
          return result;
        default:
          throw new Error(`Invalid query type: ${type}`);
      }
    } catch (error) {
      console.error('useBridgeQuery - Error in fetcher:', error);
      throw error;
    }
  }, [service, rawService, type, params, useRawFetch]);

  // Use SWR for data fetching
  const { data, error, mutate, isValidating } = useSWR<QueryResult<T, Q>, Error>(
    key,
    // Cast fetcher to the correct type
    () => fetcher() as Promise<QueryResult<T, Q>>,
    {
      revalidateOnFocus: false, // Default to false for mobile
      ...config
    }
  );

  // Track loading state
  const isLoading = isValidating || (!data && !error);

  // Define refetch function
  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);

      // Refetch data when coming back online
      if (state.isConnected && isOffline) {
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOffline, refetch]);

  // Format result based on query type
  if (type === 'list' || type === 'search') {
    const paginatedData = data as PaginatedResponse<T> | undefined;

    console.log('useBridgeQuery - paginatedData:', paginatedData);

    // Handle different response formats for meta
    let meta = paginatedData?.meta;

    console.log('useBridgeQuery - meta before conversion:', meta);
    console.log('useBridgeQuery - data before processing:', paginatedData?.data);

    // Convert meta format if needed
    if (meta) {
      // Ensure all required properties are present
      meta = {
        page: meta.page || (meta as any).currentPage || 1,
        limit: meta.limit || (meta as any).perPage || 10,
        total: meta.total || (meta as any).totalItems || 0,
        hasMore: meta.hasMore !== undefined ? meta.hasMore :
                ((meta as any).currentPage < (meta as any).totalPages)
      };
    }

    // Ensure data is an array
    let processedData: T[] = [];

    if (paginatedData?.data) {
      if (Array.isArray(paginatedData.data)) {
        processedData = paginatedData.data;
      } else if (typeof paginatedData.data === 'object') {
        // Handle case where data might be nested
        const dataObj = paginatedData.data as any;
        if (dataObj.rows && Array.isArray(dataObj.rows)) {
          processedData = dataObj.rows;
        } else if (dataObj.data && Array.isArray(dataObj.data)) {
          processedData = dataObj.data;
        } else if (dataObj.data?.rows && Array.isArray(dataObj.data.rows)) {
          processedData = dataObj.data.rows;
        }
      }
    }

    console.log('useBridgeQuery - meta after conversion:', meta);
    console.log('useBridgeQuery - data after processing:', processedData);

    return {
      data: processedData,
      meta: meta || { page: 1, limit: 10, total: 0, hasMore: false },
      isLoading,
      error: error || null,
      refetch,
      isOffline
    } as UseBridgeQueryResult<T, Q>;
  } else {
    return {
      data: (data as T) || null,
      meta: null,
      isLoading,
      error: error || null,
      refetch,
      isOffline
    } as UseBridgeQueryResult<T, Q>;
  }
}
