/**
 * Storage Debug Utilities
 *
 * Provides utilities for debugging storage-related issues
 * These utilities are only enabled when debugTools is enabled in PubflowProvider
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDebugConfig } from '../context/debugConfig';

/**
 * Debug storage keys and values
 *
 * @param prefix Optional prefix to filter keys
 * @param forceEnable Force enable debug even if not enabled in config
 * @returns Promise with the debug information
 */
export async function debugStorage(
  prefix?: string,
  forceEnable = false
): Promise<{
  keys: string[];
  values: Record<string, any>;
}> {
  // Check if debug is enabled
  const { enabled } = getDebugConfig();

  if (!enabled && !forceEnable) {
    console.warn('Storage debug is disabled. Enable it in PubflowProvider or use forceEnable=true.');
    return {
      keys: [],
      values: {}
    };
  }

  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter by prefix if provided
    const filteredKeys = prefix
      ? allKeys.filter(key => key.startsWith(prefix))
      : allKeys;

    // Get values for filtered keys
    const keyValuePairs = await AsyncStorage.multiGet(filteredKeys);

    // Convert to object
    const values: Record<string, any> = {};

    for (const [key, value] of keyValuePairs) {
      if (value) {
        try {
          // Try to parse as JSON
          values[key] = JSON.parse(value);
        } catch (e) {
          // If not JSON, store as string
          values[key] = value;
        }
      }
    }

    // Log debug information
    console.log('Storage Debug:');
    console.log('Keys:', filteredKeys);
    console.log('Values:', values);

    return {
      keys: [...filteredKeys], // Create a new array to avoid readonly issues
      values
    };
  } catch (error) {
    console.error('Error debugging storage:', error);
    return {
      keys: [],
      values: {}
    };
  }
}

/**
 * Clear storage keys with a specific prefix
 *
 * @param prefix Prefix to filter keys to remove
 * @param forceEnable Force enable debug even if not enabled in config
 * @returns Promise<void>
 */
export async function clearStorageByPrefix(
  prefix: string,
  forceEnable = false
): Promise<void> {
  // Check if debug is enabled
  const { enabled } = getDebugConfig();

  if (!enabled && !forceEnable) {
    console.warn('Storage debug is disabled. Enable it in PubflowProvider or use forceEnable=true.');
    return;
  }

  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter by prefix
    const keysToRemove = allKeys.filter(key => key.startsWith(prefix));

    if (keysToRemove.length > 0) {
      // Remove keys
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Removed ${keysToRemove.length} keys with prefix "${prefix}"`);
    } else {
      console.log(`No keys found with prefix "${prefix}"`);
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}
