/**
 * Secure Storage Adapter for React Native
 * 
 * Provides a storage adapter for React Native with Expo SecureStore support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAdapter, createStorageKey } from '@pubflow/core';

// Dynamically import Expo SecureStore to avoid requiring it as a hard dependency
let SecureStore: any = null;
try {
  // This will only succeed if expo-secure-store is installed
  SecureStore = require('expo-secure-store');
} catch (error) {
  // SecureStore is not available, will use AsyncStorage as fallback
}

/**
 * Options for the secure storage adapter
 */
export interface SecureStorageOptions {
  /**
   * Prefix for storage keys
   */
  prefix?: string;
  
  /**
   * Whether to use secure storage (SecureStore) when available
   */
  useSecureStorage?: boolean;
  
  /**
   * Whether to use AsyncStorage as fallback when SecureStore fails
   */
  useAsyncStorageFallback?: boolean;
}

/**
 * Secure storage adapter for React Native
 * Uses Expo SecureStore when available, falls back to AsyncStorage
 */
export class SecureStorageAdapter implements StorageAdapter {
  private prefix: string;
  private useSecureStorage: boolean;
  private useAsyncStorageFallback: boolean;
  
  /**
   * Create a new secure storage adapter
   * 
   * @param options Storage options
   */
  constructor(options: SecureStorageOptions = {}) {
    this.prefix = options.prefix || 'pubflow';
    this.useSecureStorage = options.useSecureStorage !== false && !!SecureStore;
    this.useAsyncStorageFallback = options.useAsyncStorageFallback !== false;
  }
  
  /**
   * Get a value from storage
   * 
   * @param key Storage key
   * @returns Stored value or null
   */
  async getItem(key: string): Promise<string | null> {
    const prefixedKey = createStorageKey(key, this.prefix);
    
    // Try SecureStore first if available and enabled
    if (this.useSecureStorage) {
      try {
        const value = await SecureStore.getItemAsync(prefixedKey);
        return value;
      } catch (error) {
        console.warn('Error getting item from SecureStore:', error);
        
        // Fall back to AsyncStorage if enabled
        if (!this.useAsyncStorageFallback) {
          return null;
        }
      }
    }
    
    // Use AsyncStorage as primary or fallback
    try {
      return await AsyncStorage.getItem(prefixedKey);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  }
  
  /**
   * Save a value to storage
   * 
   * @param key Storage key
   * @param value Value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    const prefixedKey = createStorageKey(key, this.prefix);
    
    // Try SecureStore first if available and enabled
    if (this.useSecureStorage) {
      try {
        await SecureStore.setItemAsync(prefixedKey, value);
        return;
      } catch (error) {
        console.warn('Error setting item in SecureStore:', error);
        
        // Fall back to AsyncStorage if enabled
        if (!this.useAsyncStorageFallback) {
          return;
        }
      }
    }
    
    // Use AsyncStorage as primary or fallback
    try {
      await AsyncStorage.setItem(prefixedKey, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  }
  
  /**
   * Remove a value from storage
   * 
   * @param key Storage key
   */
  async removeItem(key: string): Promise<void> {
    const prefixedKey = createStorageKey(key, this.prefix);
    
    // Try to remove from SecureStore if available and enabled
    if (this.useSecureStorage) {
      try {
        await SecureStore.deleteItemAsync(prefixedKey);
      } catch (error) {
        console.warn('Error removing item from SecureStore:', error);
      }
    }
    
    // Always try to remove from AsyncStorage as well to ensure it's not there
    try {
      await AsyncStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  }
  
  /**
   * Check if SecureStore is available
   * 
   * @returns Whether SecureStore is available
   */
  isSecureStoreAvailable(): boolean {
    return !!SecureStore;
  }
  
  /**
   * Clear all values with the current prefix
   * Note: This is an expensive operation and should be used sparingly
   */
  async clear(): Promise<void> {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys that match our prefix
      const prefixedKeys = allKeys.filter(key => 
        key.startsWith(`${this.prefix}_`)
      );
      
      // Remove from AsyncStorage
      if (prefixedKeys.length > 0) {
        await AsyncStorage.multiRemove(prefixedKeys);
      }
      
      // We can't easily clear all keys from SecureStore as it doesn't provide a way to list keys
      // If using SecureStore, we'll need to rely on specific key removal when needed
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
