# Pubflow React Native Documentation

Bienvenido a la documentación de Pubflow para React Native. Esta guía te ayudará a integrar Pubflow en tu aplicación React Native.

## Índice

- [Introducción](#introducción)
- [Instalación](#instalación)
- [Configuración Básica](#configuración-básica)
- [Autenticación](#autenticación)
- [Operaciones de Datos](#operaciones-de-datos)
- [Componentes](#componentes)
- [Soporte Offline](#soporte-offline)
- [Uso Avanzado](#uso-avanzado)

## Introducción

Pubflow para React Native es un adaptador que te permite utilizar el framework Pubflow en aplicaciones móviles desarrolladas con React Native. Proporciona:

- Almacenamiento seguro con Expo SecureStore (con fallback a AsyncStorage)
- Componentes específicos para React Native
- Hooks optimizados para aplicaciones móviles
- Soporte para modo offline
- Integración con Expo

## Instalación

### Requisitos

- React Native ≥ 0.68.0
- React ≥ 17.0.0
- @react-native-async-storage/async-storage ≥ 1.17.0
- (Opcional) expo-secure-store ≥ 12.0.0

### Instalación de paquetes

```bash
# Instalar el paquete core y el adaptador de React Native
npm install @pubflow/core @pubflow/react-native

# Instalar dependencias requeridas
npm install @react-native-async-storage/async-storage

# Opcional: Instalar Expo SecureStore para mayor seguridad
npm install expo-secure-store

# Opcional: Instalar NetInfo para mejor soporte offline
npm install @react-native-community/netinfo
```

## Configuración Básica

### Configuración del Proveedor

Envuelve tu aplicación con el `PubflowProvider`:

```jsx
// App.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PubflowProvider, OfflineIndicator } from '@pubflow/react-native';
import AppNavigator from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <PubflowProvider
        config={{
          baseUrl: 'https://api.example.com',
          bridgeBasePath: '/bridge',
          authBasePath: '/auth',
          useSecureStorage: true // Usar Expo SecureStore cuando esté disponible
        }}
        showSessionAlerts={true} // Mostrar alertas cuando la sesión expire o se refresque
      >
        <OfflineIndicator />
        <AppNavigator />
      </PubflowProvider>
    </SafeAreaProvider>
  );
}
```

## Autenticación

### Pantalla de Login

```jsx
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

      {isLoading ? (
        <ActivityIndicator color="#007AFF" style={styles.loader} />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
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
  loader: {
    marginTop: 10,
  },
});
```

### Pantallas Protegidas

Usa el hook `useAuth` para proteger pantallas:

```jsx
// screens/ProfileScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth, BridgeView } from '@pubflow/react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {user ? (
        <>
          <Text style={styles.text}>Name: {user.name}</Text>
          <Text style={styles.text}>Email: {user.email}</Text>

          <BridgeView
            allowedTypes={['admin']}
            fallback={<Text style={styles.fallback}>Admin-only content is hidden</Text>}
          >
            <Text style={styles.adminText}>Admin-only content</Text>
          </BridgeView>

          <Button title="Logout" onPress={handleLogout} />
        </>
      ) : (
        <Text>No user data available</Text>
      )}
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
  fallback: {
    fontSize: 16,
    marginVertical: 20,
    color: '#999',
    fontStyle: 'italic',
  },
});
```

## Validación de Esquemas

Se recomienda definir los esquemas de validación a nivel de la aplicación cliente, no en el adaptador. Esto permite una mayor flexibilidad y reutilización.

```jsx
// lib/schemas/user.js
import { z } from 'zod';

// Esquema para usuario completo
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: 'El rol debe ser user o admin' })
  })
});

// Esquema para crear usuario
export const createUserSchema = userSchema.omit({ id: true });

// Esquema para actualizar usuario
export const updateUserSchema = userSchema.partial().extend({
  id: z.string().uuid()
});

// Tipos TypeScript
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

## Operaciones de Datos

### Uso de useBridgeCrud

```jsx
// screens/UsersScreen.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useBridgeCrud, BridgeList } from '@pubflow/react-native';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

export default function UsersScreen({ navigation }) {
  const {
    items: users,
    loading,
    error,
    refresh,
    deleteItem,
    isOffline,
    validationErrors
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    // Pasar los esquemas definidos a nivel de aplicación
    schemas: {
      entity: userSchema,
      create: createUserSchema,
      update: updateUserSchema
    },
    successMessages: {
      delete: 'Usuario eliminado correctamente'
    },
    errorMessages: {
      delete: 'Error al eliminar el usuario'
    },
    offlineConfig: {
      queueMutations: true,
      showOfflineAlerts: true
    }
  });

  const renderUser = ({ item, isSelected }) => (
    <View style={[styles.userItem, isSelected && styles.selectedItem]}>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Button
        title="Delete"
        onPress={() => deleteItem(item.id)}
        color="#ff6b6b"
      />
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" />
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

      <BridgeList
        renderItem={renderUser}
        showSearch={true}
        showPagination={true}
        entityConfig={{
          endpoint: 'users'
        }}
        onItemPress={(user) => navigation.navigate('UserDetail', { userId: user.id })}
        emptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

// Import Button here to avoid circular dependency
import { Button } from 'react-native';
```

## Componentes

### BridgeView

El componente `BridgeView` renderiza contenido condicionalmente basado en la autenticación y el tipo de usuario:

```jsx
import { BridgeView } from '@pubflow/react-native';

// Ejemplo básico
<BridgeView>
  <Text>Este contenido solo es visible para usuarios autenticados</Text>
</BridgeView>

// Solo para administradores
<BridgeView
  allowedTypes="admin"
  fallback={<Text>No tienes permisos para ver este contenido</Text>}
>
  <Text>Este contenido solo es visible para administradores</Text>
</BridgeView>

// Múltiples tipos de usuario
<BridgeView
  allowedTypes={['admin', 'editor']}
  loadingComponent={<ActivityIndicator color="#007AFF" />}
  onUnauthorized={() => console.log('Usuario no autorizado')}
>
  <Text>Este contenido es visible para administradores y editores</Text>
</BridgeView>
```

### BridgeList

El componente `BridgeList` muestra datos en una lista con búsqueda, filtrado y paginación:

```jsx
import { BridgeList } from '@pubflow/react-native';

<BridgeList
  renderItem={({ item, index, isSelected, onSelect }) => (
    <TouchableOpacity onPress={onSelect}>
      <View style={[styles.item, isSelected && styles.selectedItem]}>
        <Text>{item.name}</Text>
      </View>
    </TouchableOpacity>
  )}
  entityConfig={{
    endpoint: 'products'
  }}
  showSearch={true}
  showPagination={true}
  searchPlaceholder="Buscar productos..."
  loadingColor="#007AFF"
  showOfflineIndicator={true}
  offlineText="Sin conexión. Algunas funciones pueden estar limitadas."
/>
```

### OfflineIndicator

El componente `OfflineIndicator` muestra un indicador cuando el dispositivo está sin conexión:

```jsx
import { OfflineIndicator } from '@pubflow/react-native';

<OfflineIndicator
  offlineText="Sin conexión a Internet"
  onlineText="Conexión restaurada"
  onlineDuration={3000}
  style={{ backgroundColor: '#d32f2f' }}
  offlineTextStyle={{ color: 'white', fontWeight: 'bold' }}
/>
```

## Soporte Offline

El adaptador de React Native incluye soporte completo para operaciones offline, permitiendo que tu aplicación siga funcionando incluso sin conexión a Internet.

### Características principales

- **Detección automática de conectividad**: Monitoreo del estado de la conexión
- **Cola de mutaciones offline**: Almacenamiento de operaciones para ejecutarlas cuando se recupere la conexión
- **Persistencia de datos**: Almacenamiento local de datos para acceso offline
- **Indicadores visuales**: Componentes para mostrar el estado de la conexión

### Ejemplo básico

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
      queueMutations: true, // Habilitar cola de mutaciones
      showOfflineAlerts: true // Mostrar alertas cuando se encolan operaciones
    }
  });

  // Crear un producto (funcionará incluso offline)
  const handleAddProduct = () => {
    createItem({
      name: 'Nuevo producto',
      price: 99.99
    });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Indicador de estado offline */}
      <OfflineIndicator />

      {/* Indicador de operaciones pendientes */}
      {queuedMutations > 0 && (
        <Text style={{ color: '#856404', backgroundColor: '#fff3cd', padding: 10 }}>
          {queuedMutations} operaciones pendientes de sincronización
        </Text>
      )}

      {/* Botón para crear producto */}
      <Button
        title={isOffline ? "Añadir producto (offline)" : "Añadir producto"}
        onPress={handleAddProduct}
      />

      {/* Lista de productos */}
      {products.map(product => (
        <View key={product.id} style={{ padding: 10, marginVertical: 5, backgroundColor: '#f8f9fa' }}>
          <Text>{product.name} - ${product.price}</Text>
        </View>
      ))}
    </View>
  );
}
```

### Documentación detallada

Para una explicación completa del soporte offline, incluyendo ejemplos avanzados y mejores prácticas, consulta la [guía de soporte offline](./offline-support.md).

## Uso Avanzado

### Caché Persistente

Pubflow React Native soporta caché persistente para mejorar el rendimiento y la experiencia offline:

```jsx
import React from 'react';
import { PubflowProvider, createPersistentCache } from '@pubflow/react-native';

function App() {
  // Crear un proveedor de caché persistente
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_rn_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 horas
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

Para más información, consulta la [documentación de caché persistente](./persistent-cache.md).

### Múltiples Instancias

Configura múltiples conexiones backend:

```jsx
// App.js
import { PubflowProvider } from '@pubflow/react-native';

export default function App() {
  return (
    <PubflowProvider
      instances={[
        {
          id: 'main',
          baseUrl: 'https://api.example.com',
          bridgeBasePath: '/bridge'
        },
        {
          id: 'analytics',
          baseUrl: 'https://analytics.example.com',
          bridgeBasePath: '/data-api'
        }
      ]}
      defaultInstance="main"
    >
      <AppNavigator />
    </PubflowProvider>
  );
}
```

Usa instancias específicas en los hooks:

```jsx
// Usar instancia específica
const { user } = useAuth('analytics');

// Usar instancia específica para operaciones CRUD
const { items: events } = useBridgeCrud({
  entityConfig: {
    endpoint: 'events'
  },
  instanceId: 'analytics'
});
```

### Almacenamiento Seguro

El adaptador utiliza Expo SecureStore cuando está disponible, con fallback a AsyncStorage:

```jsx
import { SecureStorageAdapter } from '@pubflow/react-native';

// Crear un adaptador de almacenamiento personalizado
const storage = new SecureStorageAdapter({
  prefix: 'myapp',
  useSecureStorage: true, // Usar SecureStore cuando esté disponible
  useAsyncStorageFallback: true // Usar AsyncStorage como fallback
});

// Verificar si SecureStore está disponible
const isSecureAvailable = storage.isSecureStoreAvailable();
console.log(`SecureStore está ${isSecureAvailable ? 'disponible' : 'no disponible'}`);

// Limpiar todo el almacenamiento
await storage.clear();
```

Para más información y ejemplos detallados, consulta la [referencia de API](./api-reference.md) y la sección de [ejemplos](./examples.md).
