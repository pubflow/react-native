# Pubflow Debugging Tools

This document describes the debugging tools available in the Pubflow React Native adapter.

## Storage Debugging

Pubflow provides utilities for debugging storage-related issues. These utilities are disabled by default and can be enabled via the `enableDebugTools` option in the `PubflowProvider`.

### Enabling Debug Tools

To enable the debug tools, set the `enableDebugTools` option to `true` in the `PubflowProvider`:

```tsx
import { PubflowProvider } from '@pubflow/react-native';

function App() {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        // Other config options...
      }}
      enableDebugTools={true} // Enable debug tools
    >
      {/* Your app components */}
    </PubflowProvider>
  );
}
```

### Available Debug Utilities

Once enabled, you can use the following utilities:

#### debugStorage

Inspects the contents of AsyncStorage, optionally filtered by a prefix.

```tsx
import { debugStorage } from '@pubflow/react-native';

// Debug all storage
const allStorage = await debugStorage();

// Debug storage with a specific prefix
const pubflowStorage = await debugStorage('pubflow');

// Force debug even if not enabled in PubflowProvider
const forcedDebug = await debugStorage('pubflow', true);
```

The function returns an object with the following properties:

- `keys`: Array of keys found in AsyncStorage
- `values`: Object mapping keys to their parsed values

#### clearStorageByPrefix

Clears all storage keys with a specific prefix.

```tsx
import { clearStorageByPrefix } from '@pubflow/react-native';

// Clear all storage with a specific prefix
await clearStorageByPrefix('pubflow');

// Force clear even if not enabled in PubflowProvider
await clearStorageByPrefix('pubflow', true);
```

### Security Considerations

The debug tools are designed to be used during development and should not be enabled in production. They can expose sensitive information in the logs and allow clearing storage data.

To ensure they are not enabled in production, you can use environment variables:

```tsx
<PubflowProvider
  config={config}
  enableDebugTools={__DEV__} // Only enable in development
>
  {/* Your app components */}
</PubflowProvider>
```

## Troubleshooting Common Issues

### Storage Key Duplication

If you encounter issues with duplicate storage keys (e.g., `prefix_prefix_key` instead of `prefix_key`), you can use the debug tools to inspect and clear the affected keys:

```tsx
// Inspect storage to find duplicate keys
const storage = await debugStorage();
console.log(storage.keys);

// Clear storage with the duplicate prefix
await clearStorageByPrefix('prefix_prefix');
```

### Session Management Issues

If you're experiencing issues with session management, you can use the debug tools to inspect the session data:

```tsx
// Inspect session data
const storage = await debugStorage('pubflow');
console.log('Session ID:', storage.values['pubflow_session_id']);
console.log('User data:', storage.values['pubflow_user_data']);
```

## Disabling Debug Tools

To disable the debug tools, simply remove the `enableDebugTools` option or set it to `false`:

```tsx
<PubflowProvider
  config={config}
  enableDebugTools={false} // Disable debug tools
>
  {/* Your app components */}
</PubflowProvider>
```

When disabled, calling the debug utilities will result in a warning message and no action will be taken unless you explicitly force them with the second parameter.
