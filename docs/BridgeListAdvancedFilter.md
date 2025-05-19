# BridgeList con Filtros Avanzados

El componente `BridgeList` ahora incluye soporte para filtros avanzados, lo que permite a los usuarios realizar búsquedas más precisas y específicas.

## Características

- Filtrado avanzado junto al campo de búsqueda
- Operadores predefinidos por campo para simplificar la experiencia
- Soporte para diferentes tipos de campos (texto, número, fecha, selección)
- Personalización completa de colores y textos
- Integración perfecta con el sistema de búsqueda y paginación

## Uso básico

```jsx
import { BridgeList, equals, contains, greaterThan } from '@pubflow/react-native';

// Ejemplo de uso con filtros avanzados
const MyList = () => {
  return (
    <BridgeList
      entityConfig={{ endpoint: 'users' }}
      renderItem={({ item }) => (
        <Text>{item.name}</Text>
      )}

      // Activar filtros avanzados
      showAdvancedFilters={true}

      // Definir campos filtrables con operadores predefinidos
      advancedFilterFields={[
        {
          name: 'name',
          label: 'Nombre',
          type: 'text',
          operator: 'contains' // Con comillas
        },
        {
          name: 'age',
          label: 'Edad',
          type: 'number',
          operator: greaterThan // Sin comillas
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          operator: equals, // Sin comillas
          options: [
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' }
          ]
        }
      ]}
    />
  );
};
```

## Operadores disponibles

Los operadores se pueden especificar de dos formas:

### 1. Como string con comillas

```jsx
advancedFilterFields={[
  {
    name: 'name',
    label: 'Nombre',
    type: 'text',
    operator: 'contains' // Operador como string con comillas
  }
]}
```

### 2. Como identificador directo sin comillas

```jsx
advancedFilterFields={[
  {
    name: 'name',
    label: 'Nombre',
    type: 'text',
    operator: contains // Operador directo sin comillas
  }
]}
```

### Tabla de operadores disponibles

| Operador | Descripción | Ejemplo en filtro |
|----------|-------------|-------------------|
| `equals` o `eq` | Igual a | `name:eq=John` |
| `notEquals` o `neq` | No igual a | `name:neq=John` |
| `contains` | Contiene | `name:contains=oh` |
| `notContains` o `ncontains` | No contiene | `name:ncontains=oh` |
| `startsWith` o `sw` | Comienza con | `name:sw=J` |
| `endsWith` o `ew` | Termina con | `name:ew=n` |
| `greaterThan` o `gt` | Mayor que | `age:gt=18` |
| `greaterThanOrEquals` o `gte` | Mayor o igual que | `age:gte=18` |
| `lessThan` o `lt` | Menor que | `age:lt=65` |
| `lessThanOrEquals` o `lte` | Menor o igual que | `age:lte=65` |
| `in` | En lista | `status:in=active,pending` |
| `notIn` o `nin` | No en lista | `status:nin=inactive,deleted` |
| `isNull` o `null` | Es nulo | `deletedAt:null` |
| `isNotNull` o `nnull` | No es nulo | `email:nnull` |

## Personalización

### Textos

```jsx
<BridgeList
  // ...otras props
  showAdvancedFilters={true}
  texts={{
    searchPlaceholder: 'Buscar...',
    advancedFilter: {
      title: 'Filtros Avanzados',
      filterButton: 'Filtrar',
      addFilter: 'Añadir Filtro',
      resetFilters: 'Limpiar Filtros',
      apply: 'Aplicar',
      cancel: 'Cancelar',
      field: 'Campo',
      value: 'Valor',
      noActiveFilters: 'No hay filtros activos'
    }
  }}
/>
```

### Colores

```jsx
<BridgeList
  // ...otras props
  showAdvancedFilters={true}
  colors={{
    primary: '#c30000', // Color principal
    secondary: '#f5f5f5', // Color de fondo secundario
    background: '#ffffff', // Color de fondo
    text: '#333333', // Color de texto
    border: '#dddddd', // Color de bordes
    loading: '#c30000' // Color del indicador de carga
  }}
/>
```

### Layout

```jsx
<BridgeList
  // ...otras props
  showAdvancedFilters={true}
  layout={{
    advancedFilterWidth: 40, // 40% para el filtro avanzado
    contentWidth: 60 // 60% para el contenido
  }}
/>
```

## Ventajas del nuevo enfoque

1. **Simplicidad**: Cada campo tiene un único operador predefinido, lo que simplifica la configuración y la experiencia del usuario.
2. **Consistencia**: Los operadores se definen de manera coherente para cada tipo de campo.
3. **Flexibilidad**: Sigue siendo posible personalizar el operador para cada campo según las necesidades específicas.
4. **Integración**: Funciona perfectamente con el sistema de búsqueda y paginación existente.

## Ejemplo completo

```jsx
import React from 'react';
import { View } from 'react-native';
import { BridgeList, equals, contains, greaterThan } from '@pubflow/react-native';

const UsersList = () => {
  return (
    <View style={{ flex: 1 }}>
      <BridgeList
        entityConfig={{ endpoint: 'users' }}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text>{item.email}</Text>
          </View>
        )}
        showAdvancedFilters={true}
        advancedFilterFields={[
          {
            name: 'name',
            label: 'Nombre',
            type: 'text',
            operator: 'contains'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            operator: 'contains'
          },
          {
            name: 'age',
            label: 'Edad',
            type: 'number',
            operator: 'gt'
          },
          {
            name: 'role',
            label: 'Rol',
            type: 'select',
            operator: 'eq',
            options: [
              { value: 'admin', label: 'Administrador' },
              { value: 'user', label: 'Usuario' },
              { value: 'guest', label: 'Invitado' }
            ]
          },
          {
            name: 'active',
            label: 'Activo',
            type: 'boolean',
            operator: 'eq'
          }
        ]}
        colors={{
          primary: '#c30000',
          secondary: '#f5f5f5'
        }}
      />
    </View>
  );
};

export default UsersList;
```
