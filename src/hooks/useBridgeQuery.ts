/**
 * Bridge Query Hook for React Native
 *
 * Provides a hook for querying data using Bridge API with SWR
 */

import { useState, useEffect, useCallback } from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import {
  BridgeApiService,
  EntityData,
  PaginatedResponse,
  SearchParams,
  QueryParams as CoreQueryParams
} from '@pubflow/core';
import { NetInfo } from '../utils/netInfo';

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
 * @returns Query result
 */
export function useBridgeQuery<T extends EntityData, Q extends QueryType>(
  service: BridgeApiService<T>,
  type: Q,
  params: BridgeQueryParams<Q>,
  config?: SWRConfiguration
): UseBridgeQueryResult<T, Q> {
  // Track network state
  const [isOffline, setIsOffline] = useState(false);

  // Create a unique key for SWR
  const key = JSON.stringify({ service, type, params });

  // Define fetcher function
  const fetcher = useCallback(async () => {
    // Check network connectivity
    const isConnected = await NetInfo.isConnected();
    setIsOffline(!isConnected);

    if (!isConnected) {
      throw new Error('No internet connection');
    }

    switch (type) {
      case 'list':
        return await service.getList(params as CoreQueryParams);
      case 'get':
        const { id, params: getParams } = params as { id: string; params?: CoreQueryParams };
        return await service.getById(id, getParams);
      case 'search':
        return await service.search(params as SearchParams);
      default:
        throw new Error(`Invalid query type: ${type}`);
    }
  }, [service, type, params]);

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

    return {
      data: paginatedData?.data || [],
      meta: paginatedData?.meta || { page: 1, limit: 10, total: 0, hasMore: false },
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
