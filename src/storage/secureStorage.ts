/**
 * Secure Storage Adapter for React Native
 *
 * Provides a storage adapter for React Native with Expo SecureStore support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageAdapter } from '@pubflow/core';

// Variable to control logs
const DEBUG_STORAGE = true && process.env.NODE_ENV === 'development';

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
  private storageKeys: Set<string>;

  /**
   * Create a new secure storage adapter
   *
   * @param options Storage options
   */
  constructor(options: SecureStorageOptions = {}) {
    this.prefix = options.prefix || 'pubflow';
    this.useSecureStorage = options.useSecureStorage !== false;
    this.useAsyncStorageFallback = options.useAsyncStorageFallback !== false;
    this.storageKeys = new Set();
  }

  /**
   * Create a storage key with proper prefix
   */
  private createKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  /**
   * Get a value from storage
   *
   * @param key Storage key
   * @returns Stored value or null
   */
  async getItem(key: string): Promise<string | null> {
    const prefixedKey = this.createKey(key);

    if (DEBUG_STORAGE) {
      console.log(`SecureStorageAdapter.getItem: Attempting to get ${key} (prefixed: ${prefixedKey})`);
    }

    // Try SecureStore first if available and enabled
    if (this.useSecureStorage) {
      try {
        const value = await SecureStore.getItemAsync(prefixedKey);
        if (DEBUG_STORAGE) {
          console.log(`SecureStorageAdapter.getItem: SecureStore value for ${prefixedKey}=`, value);
        }
        if (value) {
          this.storageKeys.add(prefixedKey);
          return value;
        }
      } catch (error) {
        if (DEBUG_STORAGE) {
          console.warn('Error getting item from SecureStore:', error);
        }
      }
    }

    // Try AsyncStorage with prefixed key
    try {
      const value = await AsyncStorage.getItem(prefixedKey);
      if (DEBUG_STORAGE) {
        console.log(`SecureStorageAdapter.getItem: AsyncStorage value for ${prefixedKey}=`, value);
      }
      if (value) {
        this.storageKeys.add(prefixedKey);
        return value;
      }
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
    }

    return null;
  }

  /**
   * Save a value to storage
   *
   * @param key Storage key
   * @param value Value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    const prefixedKey = this.createKey(key);

    if (DEBUG_STORAGE) {
      console.log(`SecureStorageAdapter.setItem: Setting ${key} (prefixed: ${prefixedKey})=`, value);
    }

    // Save to SecureStore if available and enabled
    if (this.useSecureStorage) {
      try {
        await SecureStore.setItemAsync(prefixedKey, value);
        this.storageKeys.add(prefixedKey);
        if (DEBUG_STORAGE) {
          console.log(`SecureStorageAdapter.setItem: Saved to SecureStore: ${prefixedKey}`);
        }
      } catch (error) {
        if (DEBUG_STORAGE) {
          console.warn('Error saving to SecureStore:', error);
        }
        if (!this.useAsyncStorageFallback) {
          throw error;
        }
      }
    }

    // Always save to AsyncStorage as fallback
    try {
      await AsyncStorage.setItem(prefixedKey, value);
      this.storageKeys.add(prefixedKey);
      if (DEBUG_STORAGE) {
        console.log(`SecureStorageAdapter.setItem: Saved to AsyncStorage: ${prefixedKey}`);
      }
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Remove a value from storage
   *
   * @param key Storage key
   */
  async removeItem(key: string): Promise<void> {
    const prefixedKey = this.createKey(key);

    if (DEBUG_STORAGE) {
      console.log(`SecureStorageAdapter.removeItem: Removing ${key} (prefixed: ${prefixedKey})`);
    }

    // Remove from SecureStore if available
    if (this.useSecureStorage) {
      try {
        await SecureStore.deleteItemAsync(prefixedKey);
        this.storageKeys.delete(prefixedKey);
        if (DEBUG_STORAGE) {
          console.log(`SecureStorageAdapter.removeItem: Removed from SecureStore: ${prefixedKey}`);
        }
      } catch (error) {
        if (DEBUG_STORAGE) {
          console.warn('Error removing from SecureStore:', error);
        }
      }
    }

    // Remove from AsyncStorage
    try {
      await AsyncStorage.removeItem(prefixedKey);
      this.storageKeys.delete(prefixedKey);
      if (DEBUG_STORAGE) {
        console.log(`SecureStorageAdapter.removeItem: Removed from AsyncStorage: ${prefixedKey}`);
      }
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all storage keys with the current prefix
   */
  async clear(): Promise<void> {
    if (DEBUG_STORAGE) {
      console.log(`SecureStorageAdapter.clear: Clearing all keys with prefix ${this.prefix}`);
    }

    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const prefixedKeys = allKeys.filter(key => key.startsWith(`${this.prefix}_`));

    // Remove each key from both storages
    for (const key of prefixedKeys) {
      if (this.useSecureStorage) {
        try {
          await SecureStore.deleteItemAsync(key);
          if (DEBUG_STORAGE) {
            console.log(`SecureStorageAdapter.clear: Removed from SecureStore: ${key}`);
          }
        } catch (error) {
          if (DEBUG_STORAGE) {
            console.warn('Error removing from SecureStore:', error);
          }
        }
      }

      try {
        await AsyncStorage.removeItem(key);
        if (DEBUG_STORAGE) {
          console.log(`SecureStorageAdapter.clear: Removed from AsyncStorage: ${key}`);
        }
      } catch (error) {
        console.error('Error removing from AsyncStorage:', error);
      }
    }

    // Clear the storage keys set
    this.storageKeys.clear();
  }

  /**
   * Get all storage keys with the current prefix
   */
  async getAllKeys(): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(key => key.startsWith(`${this.prefix}_`));
  }

  /**
   * Clear session-related data
   * This method specifically removes session and user data
   */
  async clearSessionData(): Promise<void> {
    await this.removeItem('session_id');
    await this.removeItem('user_data');
  }
}
