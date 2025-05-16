/**
 * Persistent Cache Utility for React Native
 *
 * Provides a way to persist SWR cache between app restarts
 */

import { Cache } from 'swr';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Options for persistent cache
 */
export interface PersistentCacheOptions {
  /**
   * Prefix for storage keys
   */
  prefix?: string;

  /**
   * Time to live in milliseconds
   * Default: 24 hours
   */
  ttl?: number;

  /**
   * Maximum size of a cache item in bytes
   * Default: 2MB
   */
  maxItemSize?: number;

  /**
   * Whether to compress cache data to save space
   * Default: false
   */
  compress?: boolean;

  /**
   * Custom serialization function
   * Default: JSON.stringify
   */
  serialize?: (data: any) => string;

  /**
   * Custom deserialization function
   * Default: JSON.parse
   */
  deserialize?: (text: string) => any;

  /**
   * Whether to log cache operations
   * Default: false
   */
  debug?: boolean;
}

/**
 * Creates a persistent cache provider for SWR in React Native
 *
 * @param options Cache options
 * @returns SWR cache provider
 */
export function createPersistentCache(options: PersistentCacheOptions = {}): () => Cache {
  const {
    prefix = 'pubflow_rn_cache',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxItemSize = 2 * 1024 * 1024, // 2MB
    compress = false,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debug = false
  } = options;

  // Helper for logging if debug is enabled
  const log = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[PersistentCache] ${message}`, ...args);
    }
  };

  // Compression utilities
  const compression = {
    compress: (data: string): string => {
      if (!compress) return data;

      try {
        // Simple base64 compression for React Native
        return Buffer.from(data).toString('base64');
      } catch (error) {
        log('Compression error', error);
        return data;
      }
    },

    decompress: (data: string): string => {
      if (!compress) return data;

      try {
        return Buffer.from(data, 'base64').toString('utf8');
      } catch (error) {
        log('Decompression error', error);
        return data;
      }
    }
  };

  // Storage key utilities
  const storageUtils = {
    getKey: (key: string): string => {
      return `${prefix}:${key}`;
    },

    async set(key: string, value: any): Promise<void> {
      try {
        const storageKey = this.getKey(key);

        const data = {
          value,
          timestamp: Date.now(),
          expiry: Date.now() + ttl
        };

        const serialized = serialize(data);
        const compressed = compression.compress(serialized);

        // Check size
        if (compressed.length > maxItemSize) {
          log(`Cache item too large (${compressed.length} bytes): ${key}`);
          return;
        }

        await AsyncStorage.setItem(storageKey, compressed);
        log(`Cached: ${key}`, { size: compressed.length });
      } catch (error) {
        log('Error caching item', key, error);
      }
    },

    async get(key: string): Promise<any> {
      try {
        const storageKey = this.getKey(key);
        const compressed = await AsyncStorage.getItem(storageKey);

        if (!compressed) {
          log(`Cache miss: ${key}`);
          return undefined;
        }

        const serialized = compression.decompress(compressed);
        const data = deserialize(serialized);

        // Check if expired
        if (data.expiry < Date.now()) {
          log(`Cache expired: ${key}`);
          await AsyncStorage.removeItem(storageKey);
          return undefined;
        }

        log(`Cache hit: ${key}`, { age: Date.now() - data.timestamp });
        return data.value;
      } catch (error) {
        log('Error reading cache', key, error);
        return undefined;
      }
    },

    async remove(key: string): Promise<void> {
      try {
        const storageKey = this.getKey(key);
        await AsyncStorage.removeItem(storageKey);
        log(`Removed from cache: ${key}`);
      } catch (error) {
        log('Error removing from cache', key, error);
      }
    },

    async clear(): Promise<void> {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));

        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }

        log(`Cleared ${cacheKeys.length} items from cache`);
      } catch (error) {
        log('Error clearing cache', error);
      }
    },

    async cleanup(): Promise<void> {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));
        let removed = 0;

        for (const storageKey of cacheKeys) {
          try {
            const compressed = await AsyncStorage.getItem(storageKey);
            if (!compressed) continue;

            const serialized = compression.decompress(compressed);
            const data = deserialize(serialized);

            if (data.expiry < Date.now()) {
              await AsyncStorage.removeItem(storageKey);
              removed++;
            }
          } catch (e) {
            // If we can't parse it, remove it
            await AsyncStorage.removeItem(storageKey);
            removed++;
          }
        }

        if (removed > 0) {
          log(`Cleaned up ${removed} expired items`);
        }
      } catch (error) {
        log('Error during cleanup', error);
      }
    }
  };

  // Run cleanup on initialization
  storageUtils.cleanup().catch(error => {
    log('Error during initial cleanup', error);
  });

  // Return the cache provider function
  return () => {
    // Create a Map for in-memory cache
    const map = new Map();

    // Load initial cache from AsyncStorage (this happens asynchronously)
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));

        for (const storageKey of cacheKeys) {
          const key = storageKey.substring(prefix.length + 1);
          const value = await storageUtils.get(key);

          if (value !== undefined) {
            map.set(key, value);
          }
        }

        log(`Loaded ${map.size} items from persistent cache`);
      } catch (error) {
        log('Error loading initial cache', error);
      }
    })();

    // Return the cache implementation
    return {
      get: (key: string) => {
        return map.get(key);
      },
      set: (key: string, value: any) => {
        map.set(key, value);
        storageUtils.set(key, value).catch(error => {
          log('Error setting cache item', error);
        });
        return map;
      },
      delete: (key: string) => {
        map.delete(key);
        storageUtils.remove(key).catch(error => {
          log('Error removing cache item', error);
        });
        return true;
      },
      clear: () => {
        map.clear();
        storageUtils.clear().catch(error => {
          log('Error clearing cache', error);
        });
      },
      keys: () => {
        return map.keys();
      }
    } as Cache;
  };
}
