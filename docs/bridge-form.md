# BridgeForm Component for React Native

The `BridgeForm` component provides an easy way to create forms in React Native that automatically connect to your API through the Bridge API. It integrates with Zod schemas for validation and uses `useBridgeCrud` for data operations.

## Features

- 🔄 Automatic integration with `useBridgeCrud` for CRUD operations
- ✅ Form validation using Zod schemas
- 🎨 Beautiful, customizable styling with dark mode support
- 📱 Responsive layout options
- 🧩 Support for various field types
- 🔍 Automatic field type detection from Zod schema
- 🛠️ Customizable rendering for advanced use cases

## Installation

Make sure you have the required dependencies:

```bash
# Install required dependencies
npm install @react-native-picker/picker @react-native-community/datetimepicker
```

## Basic Usage

```tsx
import { BridgeForm } from '@pubflow/react-native';
import { z } from 'zod';

// Define your schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], { 
    errorMap: () => ({ message: 'Role must be either user or admin' })
  })
});

// Use the form in your component
function CreateUserScreen() {
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

## Props

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `z.ZodType<T>` | Zod schema for validation |
| `mode` | `'create' \| 'update' \| 'partial'` | Form mode |
| `entityConfig` | `EntityConfig` | Entity configuration for BridgeApi |
| `instanceId` | `string` (optional) | Pubflow instance ID |
| `initialData` | `Partial<T>` (optional) | Initial data (for update/partial mode) |
| `id` | `string` (optional) | Record ID (for update/partial mode) |
| `fields` | `FieldConfig[]` (optional) | Fields to display (all schema fields by default) |
| `layout` | `object` (optional) | Layout configuration |
| `onSuccess` | `(data: T) => void` (optional) | Success callback |
| `onError` | `(error: Error) => void` (optional) | Error callback |
| `onCancel` | `() => void` (optional) | Cancel callback |
| `labels` | `object` (optional) | Custom labels |
| `theme` | `'light' \| 'dark' \| 'auto'` (optional) | Theme (default: 'auto') |
| `mainColor` | `string` (optional) | Main color for the form (buttons, focus rings, etc.) |
| `style` | `StyleProp<ViewStyle>` (optional) | Container style |
| `customStyles` | `object` (optional) | Custom styles for form elements |

## Advanced Usage

### Custom Field Configuration

```tsx
<BridgeForm
  schema={userSchema}
  mode="update"
  entityConfig={{ endpoint: 'users' }}
  id={userId}
  initialData={userData}
  fields={[
    { 
      name: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      description: 'Your first and last name',
      width: '100%'
    },
    { 
      name: 'email',
      type: 'email',
      width: '100%'
    },
    { 
      name: 'role', 
      type: 'select',
      options: [
        { value: 'user', label: 'Regular User' },
        { value: 'admin', label: 'Administrator' }
      ]
    },
    { 
      name: 'bio',
      type: 'textarea',
      description: 'Tell us about yourself'
    }
  ]}
/>
```

### Layout Configuration

```tsx
<BridgeForm
  schema={productSchema}
  mode="create"
  entityConfig={{ endpoint: 'products' }}
  layout={{
    columns: 2  // Display fields in 2 columns on larger screens
  }}
/>
```

### Custom Styling

```tsx
<BridgeForm
  schema={userSchema}
  mode="create"
  entityConfig={{ endpoint: 'users' }}
  theme="dark"  // Force dark theme
  mainColor="#c30000"  // Set main color to red
  style={{ padding: 20, borderRadius: 16 }}
  customStyles={{
    form: { backgroundColor: '#1a1a1a', borderWidth: 0 },
    field: { marginBottom: 20 },
    label: { color: '#ffffff', fontSize: 16 },
    input: { borderWidth: 2, height: 50 },
    button: { borderRadius: 25 },
    buttonText: { fontWeight: 'bold' }
  }}
/>
```

### Partial Updates

```tsx
<BridgeForm
  schema={userSchema}
  mode="partial"
  entityConfig={{ endpoint: 'users' }}
  id={userId}
  initialData={userData}
  fields={[
    { name: 'status' }  // Only update the status field
  ]}
  onSuccess={() => refetch()}
/>
```

### Custom Field Rendering

```tsx
<BridgeForm
  schema={productSchema}
  mode="create"
  entityConfig={{ endpoint: 'products' }}
  fields={[
    // Other fields...
    {
      name: 'category',
      render: ({ value, onChange, error, required, isDarkMode, colors }) => (
        <View>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: 'bold', 
            marginBottom: 8,
            color: colors.text
          }}>
            Product Category {required && <Text style={{ color: colors.error }}>*</Text>}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Electronics', 'Clothing', 'Food'].map(category => (
              <TouchableOpacity
                key={category}
                style={{
                  padding: 12,
                  margin: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: value === category 
                    ? colors.primary 
                    : colors.inputBackground
                }}
                onPress={() => onChange(category)}
              >
                <Text style={{
                  color: value === category ? '#ffffff' : colors.text
                }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={{ color: colors.error, marginTop: 4 }}>{error}</Text>}
        </View>
      )
    }
  ]}
/>
```

## Field Types

The `BridgeForm` component supports the following field types:

- `text` - Text input (default)
- `number` - Number input
- `email` - Email input
- `password` - Password input
- `select` - Select dropdown
- `checkbox` - Checkbox
- `radio` - Radio buttons
- `date` - Date picker
- `textarea` - Multiline text input
- `hidden` - Hidden input

## Field Configuration

Each field can be configured with the following options:

```tsx
interface FieldConfig {
  name: string;                // Field name (must exist in the schema)
  label?: string;              // Custom label
  placeholder?: string;        // Placeholder text
  description?: string;        // Help text
  type?: string;               // Field type
  options?: Array<{            // Options for select/radio
    value: any;
    label: string;
  }>;
  width?: string | number;     // Field width
  hidden?: boolean;            // Whether to hide the field
  disabled?: boolean;          // Whether to disable the field
  defaultValue?: any;          // Default value
  autoFocus?: boolean;         // Whether to autofocus
  style?: StyleProp<ViewStyle>; // Custom style for field container
  inputStyle?: StyleProp<TextStyle>; // Custom style for input
  render?: Function;           // Custom render function
}
```
