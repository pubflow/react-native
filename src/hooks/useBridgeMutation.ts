/**
 * Bridge Mutation Hook for React Native
 * 
 * Provides a hook for mutating data using Bridge API
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { BridgeApiService, EntityData } from '@pubflow/core';
import { useSWRConfig } from 'swr';
import { NetInfo } from '../utils/netInfo';

/**
 * Mutation types
 */
type MutationType = 'create' | 'update' | 'delete';

/**
 * Mutation parameters
 */
type MutationParams<T, M> = 
  M extends 'create' ? Partial<T> :
  M extends 'update' ? { id: string; data: Partial<T> } :
  M extends 'delete' ? string :
  never;

/**
 * Mutation result
 */
type MutationResult<T, M> = 
  M extends 'create' ? T :
  M extends 'update' ? T :
  M extends 'delete' ? void :
  never;

/**
 * Mutation options
 */
export interface MutationOptions {
  /**
   * Whether to invalidate queries after mutation
   */
  invalidateQueries?: boolean;
  
  /**
   * Success message
   */
  successMessage?: string;
  
  /**
   * Error message
   */
  errorMessage?: string;
  
  /**
   * Success callback
   */
  onSuccess?: (data: any) => void;
  
  /**
   * Error callback
   */
  onError?: (error: Error) => void;
  
  /**
   * Whether to show alerts for success/error
   */
  showAlerts?: boolean;
  
  /**
   * Whether to queue the mutation when offline
   */
  queueWhenOffline?: boolean;
}

/**
 * Queued mutation
 */
interface QueuedMutation<T, M extends MutationType> {
  type: M;
  params: MutationParams<T, M>;
  options: MutationOptions;
  timestamp: number;
}

/**
 * Bridge mutation hook result
 */
export interface UseBridgeMutationResult<T, M extends MutationType> {
  mutate: (params: MutationParams<T, M>, options?: MutationOptions) => Promise<MutationResult<T, M>>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
  isOffline: boolean;
  queuedMutations: number;
}

/**
 * Hook for mutating data using Bridge API
 * 
 * @param service Bridge API service
 * @param type Mutation type
 * @param defaultOptions Default mutation options
 * @returns Mutation result
 */
export function useBridgeMutation<T extends EntityData, M extends MutationType>(
  service: BridgeApiService<T>,
  type: M,
  defaultOptions: MutationOptions = {}
): UseBridgeMutationResult<T, M> {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [queuedMutations, setQueuedMutations] = useState(0);
  
  // Queue for offline mutations
  const mutationQueue = useRef<QueuedMutation<T, M>[]>([]);
  
  // SWR config for cache invalidation
  const { mutate: mutateCache } = useSWRConfig();
  
  // Check network connectivity and update state
  const checkConnectivity = useCallback(async () => {
    const isConnected = await NetInfo.isConnected();
    setIsOffline(!isConnected);
    return isConnected;
  }, []);
  
  // Process mutation queue
  const processQueue = useCallback(async () => {
    if (mutationQueue.current.length === 0) {
      return;
    }
    
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Process all queued mutations
      while (mutationQueue.current.length > 0) {
        const mutation = mutationQueue.current[0];
        
        try {
          // Perform mutation
          let result;
          switch (mutation.type) {
            case 'create':
              result = await service.create(mutation.params as Partial<T>);
              break;
            case 'update':
              const { id, data } = mutation.params as { id: string; data: Partial<T> };
              result = await service.update(id, data);
              break;
            case 'delete':
              await service.delete(mutation.params as string);
              result = undefined;
              break;
          }
          
          // Remove from queue
          mutationQueue.current.shift();
          setQueuedMutations(mutationQueue.current.length);
          
          // Show success message
          if (mutation.options.showAlerts && mutation.options.successMessage) {
            Alert.alert('Success', mutation.options.successMessage);
          }
          
          // Call success callback
          if (mutation.options.onSuccess) {
            mutation.options.onSuccess(result);
          }
        } catch (err) {
          // Remove from queue
          mutationQueue.current.shift();
          setQueuedMutations(mutationQueue.current.length);
          
          // Show error message
          if (mutation.options.showAlerts && mutation.options.errorMessage) {
            Alert.alert('Error', mutation.options.errorMessage);
          }
          
          // Call error callback
          if (mutation.options.onError && err instanceof Error) {
            mutation.options.onError(err);
          }
        }
      }
      
      // Invalidate queries
      await mutateCache(
        (key: string) => typeof key === 'string' && key.includes(JSON.stringify({ service })),
        undefined,
        { revalidate: true }
      );
    } finally {
      setIsLoading(false);
    }
  }, [service, checkConnectivity, mutateCache]);
  
  // Listen for network changes
  useState(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      // Process queue when coming back online
      if (state.isConnected && mutationQueue.current.length > 0) {
        processQueue();
      }
    });
    
    return () => {
      unsubscribe();
    };
  });
  
  // Define mutate function
  const mutate = useCallback(async (
    params: MutationParams<T, M>,
    options?: MutationOptions
  ): Promise<MutationResult<T, M>> => {
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Reset error
    setError(null);
    
    // Check network connectivity
    const isConnected = await checkConnectivity();
    
    // Queue mutation if offline and queueing is enabled
    if (!isConnected && mergedOptions.queueWhenOffline !== false) {
      // Add to queue
      mutationQueue.current.push({
        type,
        params,
        options: mergedOptions,
        timestamp: Date.now()
      });
      
      setQueuedMutations(mutationQueue.current.length);
      
      // Show alert
      if (mergedOptions.showAlerts) {
        Alert.alert(
          'Offline',
          'You are currently offline. This action will be performed when you are back online.'
        );
      }
      
      // Return a promise that will resolve when the mutation is processed
      return new Promise((resolve, reject) => {
        // This promise won't resolve until the device is back online and the mutation is processed
        // For now, we'll just reject with an offline error
        reject(new Error('Device is offline'));
      });
    }
    
    // Set loading
    setIsLoading(true);
    
    try {
      let result;
      
      // Perform mutation based on type
      switch (type) {
        case 'create':
          result = await service.create(params as Partial<T>);
          break;
        case 'update':
          const { id, data } = params as { id: string; data: Partial<T> };
          result = await service.update(id, data);
          break;
        case 'delete':
          await service.delete(params as string);
          result = undefined;
          break;
        default:
          throw new Error(`Invalid mutation type: ${type}`);
      }
      
      // Invalidate queries if configured
      if (mergedOptions.invalidateQueries !== false) {
        await mutateCache(
          (key: string) => typeof key === 'string' && key.includes(JSON.stringify({ service })),
          undefined,
          { revalidate: true }
        );
      }
      
      // Show success message
      if (mergedOptions.showAlerts && mergedOptions.successMessage) {
        Alert.alert('Success', mergedOptions.successMessage);
      }
      
      // Call success callback
      if (mergedOptions.onSuccess) {
        mergedOptions.onSuccess(result);
      }
      
      return result as MutationResult<T, M>;
    } catch (err: any) {
      // Set error
      setError(err);
      
      // Show error message
      if (mergedOptions.showAlerts && mergedOptions.errorMessage) {
        Alert.alert('Error', mergedOptions.errorMessage);
      }
      
      // Call error callback
      if (mergedOptions.onError) {
        mergedOptions.onError(err);
      }
      
      throw err;
    } finally {
      // Reset loading
      setIsLoading(false);
    }
  }, [service, type, defaultOptions, checkConnectivity, mutateCache]);
  
  // Define reset function
  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);
  
  return {
    mutate,
    isLoading,
    error,
    reset,
    isOffline,
    queuedMutations
  };
}
