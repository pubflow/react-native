# Control de Logs en Pubflow React Native

Este documento describe cómo controlar y gestionar los logs generados por el adaptador de React Native para Pubflow.

## Índice

- [Introducción](#introducción)
- [Configuración de Logs](#configuración-de-logs)
- [Desactivación de Logs](#desactivación-de-logs)
- [Logs en Producción](#logs-en-producción)
- [Depuración Avanzada](#depuración-avanzada)
- [Solución de Problemas Comunes](#solución-de-problemas-comunes)

## Introducción

El adaptador de React Native para Pubflow genera logs para ayudar en el desarrollo y depuración de aplicaciones. Sin embargo, estos logs pueden ser intrusivos y afectar el rendimiento en producción, especialmente en dispositivos móviles con recursos limitados.

Este documento explica cómo controlar estos logs para optimizar el rendimiento y la experiencia del usuario.

## Configuración de Logs

### Configuración en PubflowProvider

Puedes controlar el nivel de logs a través de la configuración del `PubflowProvider`:

```tsx
import { PubflowProvider } from '@pubflow/react-native';

function App() {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        // Otras opciones de configuración...
      }}
      loggingConfig={{
        enabled: __DEV__, // Activar logs solo en desarrollo
        level: 'warn',    // Solo mostrar advertencias y errores
        storage: false    // Desactivar logs de almacenamiento
      }}
    >
      {/* Componentes de tu aplicación */}
    </PubflowProvider>
  );
}
```

### Opciones de Configuración de Logs

El objeto `loggingConfig` acepta las siguientes propiedades:

| Propiedad | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| `enabled` | boolean | Activa o desactiva todos los logs | `true` en desarrollo, `false` en producción |
| `level` | string | Nivel mínimo de logs a mostrar: 'debug', 'info', 'warn', 'error' | `'info'` |
| `storage` | boolean | Activa o desactiva los logs específicos de almacenamiento | `true` en desarrollo, `false` en producción |
| `auth` | boolean | Activa o desactiva los logs específicos de autenticación | `true` en desarrollo, `false` en producción |
| `api` | boolean | Activa o desactiva los logs específicos de API | `true` en desarrollo, `false` en producción |

## Desactivación de Logs

### Desactivación Completa

Para desactivar completamente todos los logs:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    enabled: false
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

### Desactivación Selectiva

También puedes desactivar categorías específicas de logs:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    storage: false, // Desactivar logs de almacenamiento
    auth: true,     // Mantener logs de autenticación
    api: false      // Desactivar logs de API
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

## Logs en Producción

En entornos de producción, se recomienda desactivar todos los logs para optimizar el rendimiento:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    enabled: false // Desactivar todos los logs en producción
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

Alternativamente, puedes usar variables de entorno para controlar los logs:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    enabled: __DEV__, // Activar logs solo en desarrollo
    level: __DEV__ ? 'debug' : 'error' // Logs detallados en desarrollo, solo errores en producción
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

## Depuración Avanzada

### Activación Temporal de Logs

En situaciones donde necesitas depurar problemas en producción, puedes activar temporalmente los logs:

```tsx
// Archivo de configuración
export const DEBUG_MODE = false; // Cambiar a true para activar logs temporalmente

// En tu componente App
<PubflowProvider
  config={config}
  loggingConfig={{
    enabled: __DEV__ || DEBUG_MODE,
    level: DEBUG_MODE ? 'debug' : 'error'
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

### Logs de Almacenamiento

Los logs de almacenamiento pueden ser especialmente verbosos y causar problemas de rendimiento. Para controlar específicamente estos logs:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    storage: false // Desactivar solo los logs de almacenamiento
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

## Solución de Problemas Comunes

### Bucles Infinitos de Logs

Si experimentas bucles infinitos de logs, especialmente relacionados con el almacenamiento, desactiva los logs de almacenamiento:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    storage: false
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

### Rendimiento Lento

Si la aplicación se vuelve lenta debido a la cantidad de logs:

1. Desactiva los logs completamente
2. Aumenta el nivel mínimo de logs (por ejemplo, a 'error')
3. Desactiva categorías específicas de logs que no necesitas

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    level: 'error', // Solo mostrar errores
    storage: false, // Desactivar logs de almacenamiento
    api: false      // Desactivar logs de API
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

### Logs Intrusivos en Desarrollo

Si los logs son demasiado intrusivos incluso durante el desarrollo:

```tsx
<PubflowProvider
  config={config}
  loggingConfig={{
    level: 'warn' // Solo mostrar advertencias y errores
  }}
>
  {/* Componentes de tu aplicación */}
</PubflowProvider>
```

## Conclusión

El control adecuado de los logs es esencial para optimizar el rendimiento y la experiencia del usuario en aplicaciones React Native que utilizan Pubflow. Utiliza las opciones de configuración proporcionadas para ajustar los logs según tus necesidades específicas.

Para más información sobre depuración en Pubflow, consulta la [guía de depuración](./debugging.md).
