# Persistent Cache in React Native

This document explains how to use persistent cache with the `@pubflow/react-native` package.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration Options](#configuration-options)
- [Usage with useBridgeCrud](#usage-with-usebridgecrud)
- [Usage with useBridgeQuery](#usage-with-usebridgequery)
- [Mobile-Specific Considerations](#mobile-specific-considerations)
- [Advanced Usage](#advanced-usage)
  - [Custom Storage Keys](#custom-storage-keys)
  - [Compression](#compression)
  - [Cache Invalidation](#cache-invalidation)
  - [Debugging](#debugging)
  - [Background Sync](#background-sync)

## Overview

By default, SWR (the data fetching library used by Pubflow) stores its cache in memory. This means that when the user closes and reopens the application, all cached data is lost and must be fetched again.

Persistent cache solves this problem by storing the cache in AsyncStorage, allowing the data to persist between application restarts. This provides several benefits:

1. **Improved initial load time**: The application can show cached data immediately while fetching fresh data in the background.
2. **Reduced API calls**: The application doesn't need to refetch data that hasn't changed.
3. **Better offline experience**: The application can show cached data even when offline.
4. **Reduced data usage**: Particularly important for mobile applications where users may have limited data plans.

## Setup

To enable persistent cache in your React Native application, you need to:

1. Install the required dependencies
2. Create a persistent cache provider
3. Pass it to the `PubflowProvider`

### Install Dependencies

```bash
# Install AsyncStorage if not already installed
npm install @react-native-async-storage/async-storage
```

### Configure Persistent Cache

```jsx
// App.js
import React from 'react';
import { PubflowProvider, createPersistentCache } from '@pubflow/react-native';

function App() {
  // Create a persistent cache provider
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_rn_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    debug: __DEV__
  });
  
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
      persistentCache={{
        enabled: true,
        provider: persistentCacheProvider
      }}
    >
      <YourApp />
    </PubflowProvider>
  );
}

export default App;
```

## Configuration Options

The `createPersistentCache` function accepts the following options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| prefix | string | Prefix for storage keys | 'pubflow_rn_cache' |
| ttl | number | Time to live in milliseconds | 24 * 60 * 60 * 1000 (24 hours) |
| maxItemSize | number | Maximum size of a cache item in bytes | 2 * 1024 * 1024 (2MB) |
| compress | boolean | Whether to compress cache data to save space | false |
| serialize | function | Custom serialization function | JSON.stringify |
| deserialize | function | Custom deserialization function | JSON.parse |
| debug | boolean | Whether to log cache operations | false |

## Usage with useBridgeCrud

Once you've set up persistent cache, it will automatically work with `useBridgeCrud`. The cache keys are generated based on the entity configuration and search parameters, ensuring that the cache is properly maintained.

```jsx
// screens/UserListScreen.js
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useBridgeCrud } from '@pubflow/react-native';

export default function UserListScreen() {
  const {
    items: users,
    loading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    hasMore,
    refresh
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    }
  });
  
  // The data will be cached and persisted between app restarts
  
  if (loading && users.length === 0) {
    return <Text>Loading...</Text>;
  }
  
  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Button title="Retry" onPress={refresh} />
      </View>
    );
  }
  
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Text>{item.name}</Text>
      )}
      onEndReached={() => {
        if (hasMore) {
          setPage(page + 1);
        }
      }}
      onEndReachedThreshold={0.5}
      refreshing={loading}
      onRefresh={refresh}
    />
  );
}
```

## Usage with useBridgeQuery

Similarly, `useBridgeQuery` will automatically use the persistent cache:

```jsx
// screens/CustomUserListScreen.js
import React from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { useBridgeApi, useBridgeQuery } from '@pubflow/react-native';

export default function CustomUserListScreen() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { 
    data: users, 
    isLoading, 
    error, 
    refetch 
  } = useBridgeQuery(
    userService,
    'list',
    { limit: 10, page: 1 }
  );
  
  // The data will be cached and persisted between app restarts
  
  if (isLoading && (!users || users.length === 0)) {
    return <Text>Loading...</Text>;
  }
  
  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }
  
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Text>{item.name}</Text>
      )}
      refreshing={isLoading}
      onRefresh={refetch}
    />
  );
}
```

## Mobile-Specific Considerations

When using persistent cache in React Native, there are some important considerations:

1. **AsyncStorage limitations**: AsyncStorage has size limitations and is asynchronous, which can affect performance.

2. **App state**: The cache is loaded asynchronously when the app starts, which means it might not be available immediately.

3. **Memory usage**: Be mindful of the amount of data you cache, as it can impact memory usage.

4. **Background app refresh**: The cache is not automatically refreshed when the app is in the background.

5. **Device storage**: Be considerate of the user's device storage, especially on lower-end devices.

To address these considerations, you can:

1. **Use compression**: Enable compression to reduce the size of cached data.

2. **Set appropriate TTL**: Use shorter TTL for frequently changing data.

3. **Implement background sync**: Use background tasks to refresh the cache when the app is in the background.

4. **Monitor cache size**: Implement a mechanism to monitor and limit the cache size.

## Advanced Usage

### Custom Storage Keys

By default, the cache keys are generated based on the entity configuration and search parameters. However, you can customize the prefix to avoid conflicts with other applications:

```jsx
const persistentCacheProvider = createPersistentCache({
  prefix: 'my_custom_rn_app_cache'
});
```

### Compression

For large datasets, you can enable compression to reduce the storage size:

```jsx
const persistentCacheProvider = createPersistentCache({
  compress: true
});
```

### Cache Invalidation

The cache is automatically invalidated when:

1. The TTL (time to live) expires
2. A mutation operation is performed (create, update, delete)

You can also manually invalidate the cache by calling the `clear` method on the SWR cache:

```jsx
import { useSWRConfig } from 'swr';
import { Button } from 'react-native';

function ClearCacheButton() {
  const { cache } = useSWRConfig();
  
  const handleClearCache = () => {
    cache.clear();
  };
  
  return (
    <Button 
      title="Clear Cache" 
      onPress={handleClearCache} 
    />
  );
}
```

### Debugging

You can enable debug mode to see cache operations in the console:

```jsx
const persistentCacheProvider = createPersistentCache({
  debug: __DEV__
});
```

This will log cache hits, misses, and other operations, which can be useful for debugging.

### Background Sync

To implement background sync, you can use libraries like `react-native-background-fetch` or `react-native-background-actions`:

```jsx
import BackgroundFetch from 'react-native-background-fetch';
import { useBridgeApi } from '@pubflow/react-native';

// Initialize background fetch
BackgroundFetch.configure(
  {
    minimumFetchInterval: 15, // Fetch every 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  },
  async (taskId) => {
    console.log('[BackgroundFetch] Task:', taskId);
    
    try {
      // Create API client
      const userService = useBridgeApi({ endpoint: 'users' });
      
      // Fetch latest data
      await userService.getList({ limit: 10 });
      
      // Mark task as complete
      BackgroundFetch.finish(taskId);
    } catch (error) {
      console.error('[BackgroundFetch] Error:', error);
      BackgroundFetch.finish(taskId);
    }
  },
  (error) => {
    console.error('[BackgroundFetch] Failed to configure:', error);
  }
);
```

This will periodically fetch data in the background, keeping the cache up to date even when the app is not in use.
