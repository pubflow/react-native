# Soporte Offline en Pubflow para React Native

Esta guía explica en detalle cómo funciona el soporte offline en el adaptador de React Native para Pubflow y cómo puedes aprovecharlo en tus aplicaciones.

## Índice

- [Introducción](#introducción)
- [Detección de Conectividad](#detección-de-conectividad)
- [Cola de Mutaciones Offline](#cola-de-mutaciones-offline)
- [Persistencia de Datos](#persistencia-de-datos)
- [Indicadores de Estado Offline](#indicadores-de-estado-offline)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Configuración Avanzada](#configuración-avanzada)
- [Mejores Prácticas](#mejores-prácticas)

## Introducción

El soporte offline en Pubflow para React Native permite que tu aplicación siga funcionando incluso cuando el dispositivo no tiene conexión a Internet. Las principales características incluyen:

1. **Detección automática de conectividad**: Monitoreo del estado de la conexión
2. **Cola de mutaciones offline**: Almacenamiento de operaciones para ejecutarlas cuando se recupere la conexión
3. **Persistencia de datos**: Almacenamiento local de datos para acceso offline
4. **Indicadores visuales**: Componentes para mostrar el estado de la conexión

## Detección de Conectividad

Pubflow utiliza un wrapper alrededor de `@react-native-community/netinfo` para detectar el estado de la conexión. Este wrapper funciona incluso si el paquete no está instalado, proporcionando valores predeterminados.

### Uso básico

```jsx
import { NetInfo } from '@pubflow/react-native';

// Verificar si el dispositivo está conectado
const checkConnection = async () => {
  const isConnected = await NetInfo.isConnected();
  console.log(`El dispositivo está ${isConnected ? 'conectado' : 'desconectado'}`);
};

// Escuchar cambios en la conectividad
const unsubscribe = NetInfo.addEventListener(state => {
  console.log(`Estado de la conexión: ${state.isConnected ? 'conectado' : 'desconectado'}`);
  if (state.isConnected) {
    console.log('Conexión recuperada, sincronizando datos...');
  }
});

// Importante: cancelar la suscripción cuando el componente se desmonte
useEffect(() => {
  return () => {
    unsubscribe();
  };
}, []);
```

### Integración con hooks

Todos los hooks de Pubflow (`useBridgeQuery`, `useBridgeMutation`, `useBridgeCrud`) integran automáticamente la detección de conectividad y exponen el estado a través de la propiedad `isOffline`:

```jsx
const { 
  items, 
  loading, 
  error, 
  isOffline 
} = useBridgeCrud({
  entityConfig: {
    endpoint: 'products'
  }
});

// Mostrar un mensaje cuando está offline
{isOffline && (
  <Text style={styles.offlineMessage}>
    Trabajando en modo offline
  </Text>
)}
```

## Cola de Mutaciones Offline

La característica más potente del soporte offline es la cola de mutaciones, que permite a los usuarios realizar cambios incluso cuando están desconectados.

### Cómo funciona

1. Cuando el usuario realiza una operación (crear, actualizar, eliminar) mientras está offline, la operación se almacena en una cola en memoria.
2. Se muestra una notificación al usuario indicando que la operación se realizará cuando se recupere la conexión.
3. Cuando el dispositivo vuelve a estar online, las operaciones en cola se ejecutan automáticamente en el orden en que fueron agregadas.
4. Si una operación falla, se continúa con la siguiente (este comportamiento es configurable).
5. El número de operaciones en cola está disponible a través de la propiedad `queuedMutations`.

### Configuración

La cola de mutaciones se puede configurar a nivel global o por operación:

```jsx
// Configuración global en useBridgeCrud
const crudHook = useBridgeCrud({
  entityConfig: {
    endpoint: 'products'
  },
  offlineConfig: {
    queueMutations: true, // Habilitar cola de mutaciones
    showOfflineAlerts: true // Mostrar alertas cuando se encolan operaciones
  }
});

// Configuración por operación
const handleCreate = async () => {
  try {
    await crudHook.createItem(newProduct, {
      queueWhenOffline: true, // Encolar si está offline
      showAlerts: true // Mostrar alertas
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Monitoreo de la cola

Puedes monitorear el estado de la cola de mutaciones:

```jsx
const { 
  createItem, 
  updateItem, 
  deleteItem, 
  queuedMutations,
  isOffline
} = useBridgeCrud({
  entityConfig: {
    endpoint: 'products'
  }
});

// Mostrar indicador de operaciones pendientes
{queuedMutations > 0 && (
  <View style={styles.queueBadge}>
    <Text style={styles.queueText}>{queuedMutations}</Text>
  </View>
)}

// Mostrar mensaje detallado
{queuedMutations > 0 && (
  <Text>
    {queuedMutations} {queuedMutations === 1 ? 'operación pendiente' : 'operaciones pendientes'} 
    de sincronización
  </Text>
)}
```

### Ejemplo completo

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useBridgeCrud, OfflineIndicator } from '@pubflow/react-native';

export default function ProductsScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  
  const { 
    items: products, 
    createItem, 
    deleteItem, 
    isOffline, 
    queuedMutations 
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'products'
    },
    offlineConfig: {
      queueMutations: true,
      showOfflineAlerts: true
    },
    successMessages: {
      create: 'Producto creado correctamente',
      delete: 'Producto eliminado correctamente'
    }
  });
  
  const handleAddProduct = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    
    try {
      await createItem({
        name,
        price: parseFloat(price)
      });
      
      // Limpiar formulario
      setName('');
      setPrice('');
    } catch (error) {
      console.error('Error al crear producto:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      {/* Indicador de operaciones pendientes */}
      {queuedMutations > 0 && (
        <View style={styles.queueContainer}>
          <Text style={styles.queueText}>
            {queuedMutations} {queuedMutations === 1 ? 'operación pendiente' : 'operaciones pendientes'} 
            de sincronización
          </Text>
        </View>
      )}
      
      {/* Formulario */}
      <View style={styles.form}>
        <Text style={styles.label}>Nombre del producto</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ingrese nombre"
        />
        
        <Text style={styles.label}>Precio</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Ingrese precio"
          keyboardType="numeric"
        />
        
        <Button
          title={isOffline ? "Añadir producto (offline)" : "Añadir producto"}
          onPress={handleAddProduct}
        />
      </View>
      
      {/* Lista de productos */}
      <Text style={styles.heading}>Productos ({products.length})</Text>
      {products.map(product => (
        <View key={product.id} style={styles.productItem}>
          <View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>
          </View>
          <Button
            title="Eliminar"
            color="#ff6b6b"
            onPress={() => deleteItem(product.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  queueContainer: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  queueText: {
    color: '#856404',
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#28a745',
    fontWeight: 'bold',
  },
});
```

## Persistencia de Datos

Además de encolar mutaciones, Pubflow también puede almacenar datos para acceso offline:

1. **Caché automática**: Los datos obtenidos con `useBridgeQuery` se almacenan en caché automáticamente.
2. **Almacenamiento manual**: Puedes almacenar datos manualmente usando `SecureStorageAdapter`.

```jsx
import { SecureStorageAdapter } from '@pubflow/react-native';

// Crear un adaptador de almacenamiento
const storage = new SecureStorageAdapter({
  prefix: 'myapp_offline'
});

// Guardar datos para acceso offline
const saveOfflineData = async (key, data) => {
  await storage.setItem(key, JSON.stringify(data));
};

// Recuperar datos offline
const getOfflineData = async (key) => {
  const data = await storage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Ejemplo de uso
const cacheProductsForOffline = async (products) => {
  await saveOfflineData('products_cache', products);
  console.log('Productos guardados para acceso offline');
};

const loadOfflineProducts = async () => {
  const cachedProducts = await getOfflineData('products_cache');
  if (cachedProducts) {
    console.log('Cargados', cachedProducts.length, 'productos desde caché offline');
    return cachedProducts;
  }
  return [];
};
```

## Indicadores de Estado Offline

Pubflow proporciona componentes para mostrar el estado de la conexión:

### OfflineIndicator

```jsx
import { OfflineIndicator } from '@pubflow/react-native';

// Uso básico
<OfflineIndicator />

// Personalizado
<OfflineIndicator
  offlineText="Sin conexión a Internet"
  onlineText="Conexión restaurada"
  onlineDuration={5000}
  style={{ backgroundColor: '#d32f2f' }}
  offlineTextStyle={{ color: 'white', fontWeight: 'bold' }}
/>
```

### Indicadores personalizados

También puedes crear tus propios indicadores utilizando el estado `isOffline`:

```jsx
import { useBridgeCrud } from '@pubflow/react-native';

function MyComponent() {
  const { isOffline } = useBridgeCrud({
    entityConfig: {
      endpoint: 'products'
    }
  });
  
  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="wifi-off" size={20} color="white" />
          <Text style={styles.offlineText}>
            Modo offline activado
          </Text>
        </View>
      )}
      
      {/* Resto del componente */}
    </View>
  );
}
```

## Configuración Avanzada

### Personalización de la cola de mutaciones

Puedes personalizar el comportamiento de la cola de mutaciones:

```jsx
// En useBridgeMutation
const { 
  mutate, 
  isLoading, 
  error, 
  isOffline,
  queuedMutations
} = useBridgeMutation(
  productService,
  'create',
  {
    // Opciones generales
    successMessage: 'Producto creado correctamente',
    errorMessage: 'Error al crear el producto',
    
    // Opciones de offline
    queueWhenOffline: true, // Encolar cuando esté offline
    showAlerts: true, // Mostrar alertas
    
    // Callbacks
    onSuccess: (data) => {
      console.log('Operación exitosa:', data);
    },
    onError: (error) => {
      console.error('Error en operación:', error);
    }
  }
);
```

### Priorización de operaciones

Por defecto, las operaciones se ejecutan en el orden en que fueron encoladas (FIFO). Si necesitas priorizar ciertas operaciones, puedes implementar tu propia lógica de priorización:

```jsx
// Ejemplo conceptual (no incluido directamente en la API)
const priorityMutation = async (data, priority = 'normal') => {
  // Verificar si está offline
  const isConnected = await NetInfo.isConnected();
  
  if (!isConnected) {
    // Encolar con prioridad
    enqueueOperation({
      type: 'create',
      data,
      priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2
    });
    return;
  }
  
  // Si está online, ejecutar normalmente
  return await createItem(data);
};
```

## Mejores Prácticas

1. **Siempre verifica el estado offline**: Muestra indicadores claros cuando la aplicación está en modo offline.

2. **Proporciona feedback al usuario**: Informa al usuario cuando las operaciones se encolan y cuando se completan.

3. **Maneja conflictos**: Implementa estrategias para manejar conflictos cuando las operaciones encoladas se ejecutan (por ejemplo, si un elemento fue eliminado por otro usuario).

4. **Limita operaciones offline**: Algunas operaciones pueden no ser adecuadas para el modo offline. Considera deshabilitar funcionalidades complejas cuando no hay conexión.

5. **Prueba el modo offline**: Prueba exhaustivamente el comportamiento de tu aplicación en modo offline y durante transiciones entre estados de conectividad.

6. **Optimiza el almacenamiento**: No almacenes grandes cantidades de datos localmente, ya que puede afectar el rendimiento de la aplicación.

7. **Implementa sincronización bidireccional**: Para aplicaciones con uso intensivo offline, considera implementar sincronización bidireccional con resolución de conflictos.

```jsx
// Ejemplo de sincronización al recuperar conexión
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected && previouslyOffline) {
      // Sincronizar datos locales con el servidor
      await syncLocalChanges();
      // Obtener cambios del servidor
      await fetchServerChanges();
    }
    setPreviouslyOffline(!state.isConnected);
  });
  
  return () => unsubscribe();
}, [previouslyOffline]);
```

## Conclusión

El soporte offline en Pubflow para React Native proporciona una experiencia de usuario fluida incluso cuando no hay conexión a Internet. La cola de mutaciones offline, combinada con la persistencia de datos y los indicadores visuales, permite a los usuarios seguir trabajando sin interrupciones, con la seguridad de que sus cambios se sincronizarán cuando se recupere la conexión.
