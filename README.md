# @pubflow/react-native

React Native adapter for the Pubflow framework with Expo support.

## Overview

`@pubflow/react-native` provides React Native-specific implementations and utilities for the Pubflow framework, including:

- Secure storage with Expo SecureStore (with AsyncStorage fallback)
- React Native-specific components
- Hooks optimized for mobile applications
- Support for offline mode with mutation queuing

## Installation

```bash
# Install the core package and React Native adapter
npm install @pubflow/core @pubflow/react-native

# Install required peer dependencies
npm install @react-native-async-storage/async-storage

# Optional: Install Expo SecureStore for enhanced security
npm install expo-secure-store

# Optional: Install NetInfo for better offline support
npm install @react-native-community/netinfo

# Optional: Install Zod for schema validation
npm install zod
```

## Persistent Cache

Pubflow React Native adapter supports persistent caching to improve performance and offline experience:

```jsx
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

For more information, see the persistent cache documentation.

## Usage

### Provider Setup

```jsx
// App.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PubflowProvider } from '@pubflow/react-native';
import AppNavigator from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <PubflowProvider
        config={{
          baseUrl: 'https://api.example.com',
          bridgeBasePath: '/bridge',
          authBasePath: '/auth',
          useSecureStorage: true // Use Expo SecureStore when available
        }}
      >
        <AppNavigator />
      </PubflowProvider>
    </SafeAreaProvider>
  );
}
```

### Authentication

```jsx
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useAuth } from '@pubflow/react-native';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    try {
      const result = await login({ email, password });

      if (result.success) {
        navigation.navigate('Home');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={isLoading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});
```

### Protected Screens

```jsx
// screens/ProfileScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth, BridgeView } from '@pubflow/react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {user ? (
        <>
          <Text style={styles.text}>Name: {user.name}</Text>
          <Text style={styles.text}>Email: {user.email}</Text>

          <BridgeView
            allowedTypes={['admin']}
            fallback={<Text>Admin-only content is hidden</Text>}
          >
            <Text style={styles.adminText}>Admin-only content</Text>
          </BridgeView>

          <Button title="Logout" onPress={handleLogout} />
        </>
      ) : (
        <Text>Loading user data...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  adminText: {
    fontSize: 16,
    marginVertical: 20,
    color: 'purple',
    fontWeight: 'bold',
  },
});
```

### Data Operations

```jsx
// screens/UsersScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useBridgeCrud } from '@pubflow/react-native';

export default function UsersScreen({ navigation }) {
  const {
    items: users,
    loading,
    error,
    refresh,
    deleteItem
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    }
  });

  const handleDelete = (id) => {
    deleteItem(id);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <Button title="Retry" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshing={loading}
        onRefresh={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  deleteButton: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#ffdddd',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: 'red',
  },
});
```

## BridgeForm Component

Pubflow provides a powerful form component that integrates with Zod schemas and Bridge API:

```jsx
import { BridgeForm } from '@pubflow/react-native';
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], 'Role must be either user or admin')
});

function CreateUser() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Create User
      </Text>
      <BridgeForm
        schema={userSchema}
        mode="create"
        entityConfig={{ endpoint: 'users' }}
        mainColor="#c30000"
        onSuccess={(data) => {
          console.log('User created:', data);
          // Navigate or show success message
        }}
      />
    </View>
  );
}
```

For more information, see the [BridgeForm documentation](./docs/bridge-form.md).

## Offline Support

The adapter includes robust support for offline operations:

```jsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useBridgeCrud, OfflineIndicator } from '@pubflow/react-native';

export default function ProductsScreen() {
  const {
    items: products,
    createItem,
    isOffline,
    queuedMutations
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'products'
    },
    offlineConfig: {
      queueMutations: true, // Enable mutation queuing
      showOfflineAlerts: true // Show alerts when operations are queued
    }
  });

  return (
    <View>
      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Pending operations counter */}
      {queuedMutations > 0 && (
        <Text>
          {queuedMutations} operations pending synchronization
        </Text>
      )}

      {/* Create button works even offline */}
      <Button
        title="Add Product"
        onPress={() => createItem({ name: 'New Product', price: 99.99 })}
      />
    </View>
  );
}
```

For detailed documentation on offline support, see the [full documentation](./docs/README.md).

## License

AGPL-3.0-or-later
