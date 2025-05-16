# Components Reference

This document provides a comprehensive reference for all components available in the `@pubflow/react-native` package.

## Table of Contents

- [BridgeForm](#bridgeform)
- [BridgeView](#bridgeview)
- [BridgeList](#bridgelist)
- [OfflineIndicator](#offlineindicator)

## BridgeForm

The `BridgeForm` component provides an easy way to create forms that automatically connect to your API through the Bridge API. It integrates with Zod schemas for validation and uses `useBridgeCrud` for data operations.

### Usage

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

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| schema | z.ZodType<T> | Zod schema for validation | Required |
| mode | 'create' \| 'update' \| 'partial' | Form mode | Required |
| entityConfig | EntityConfig | Entity configuration | Required |
| instanceId | string | Pubflow instance ID | 'default' |
| initialData | Partial<T> | Initial data (for update/partial mode) | undefined |
| id | string | Record ID (for update/partial mode) | undefined |
| fields | FieldConfig[] | Fields to display | All schema fields |
| layout | object | Layout configuration | undefined |
| onSuccess | (data: T) => void | Success callback | undefined |
| onError | (error: Error) => void | Error callback | undefined |
| onCancel | () => void | Cancel callback | undefined |
| labels | object | Custom labels | {} |
| theme | 'light' \| 'dark' \| 'auto' | Theme | 'auto' |
| mainColor | string | Main color for the form | undefined |
| style | StyleProp<ViewStyle> | Container style | undefined |
| customStyles | object | Custom styles for form elements | {} |

For more detailed information, see the [BridgeForm documentation](./bridge-form.md).

## BridgeView

The `BridgeView` component conditionally renders content based on authentication and user type.

### Usage

```jsx
import { BridgeView } from '@pubflow/react-native';

// Basic example - only visible to authenticated users
function AuthenticatedContent() {
  return (
    <BridgeView>
      <Text>This content is only visible to authenticated users</Text>
    </BridgeView>
  );
}

// Only visible to admins
function AdminContent() {
  return (
    <BridgeView
      allowedTypes="admin"
      fallback={<Text>You don't have permission to view this content</Text>}
    >
      <Text>This content is only visible to admins</Text>
    </BridgeView>
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| children | React.ReactNode | Content to render if conditions are met | Required |
| allowedTypes | string \| string[] | User types allowed to view the content | ['authenticated'] |
| fallback | React.ReactNode | Content to render if conditions are not met | null |
| loadingComponent | React.ReactNode | Loading component | Default loading component |
| onUnauthorized | () => void | Callback when user is not authorized | undefined |
| instanceId | string | Pubflow instance ID | 'default' |

## BridgeList

The `BridgeList` component displays data in a list with sorting, filtering, and pagination.

### Usage

```jsx
import { BridgeList } from '@pubflow/react-native';

function UserList() {
  const handlePress = (user) => {
    // Handle user selection
    console.log('Selected user:', user);
  };

  return (
    <BridgeList
      entityConfig={{
        endpoint: 'users'
      }}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handlePress(item)}>
          <View style={styles.userItem}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
      showSearch={true}
      showPagination={true}
      emptyComponent={<Text>No users found</Text>}
    />
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| entityConfig | EntityConfig | Entity configuration | Required |
| renderItem | (info: { item: T; index: number }) => React.ReactElement | Render function for each item | Required |
| keyExtractor | (item: T, index: number) => string | Function to extract a key for each item | Required |
| showPagination | boolean | Whether to show pagination | true |
| showSearch | boolean | Whether to show search | true |
| showFilters | boolean | Whether to show filters | false |
| onItemPress | (item: T) => void | Item press handler | undefined |
| style | StyleProp<ViewStyle> | List container style | undefined |
| contentContainerStyle | StyleProp<ViewStyle> | Content container style | undefined |
| loadingComponent | React.ReactNode | Loading component | Default loading component |
| emptyComponent | React.ReactNode | Empty component | Default empty component |
| errorComponent | React.ReactNode | Error component | Default error component |
| paginationComponent | React.ReactNode | Pagination component | Default pagination component |
| searchComponent | React.ReactNode | Search component | Default search component |
| filterComponent | React.ReactNode | Filter component | Default filter component |
| searchPlaceholder | string | Search placeholder | 'Search...' |
| instanceId | string | Pubflow instance ID | 'default' |
| schemas | EntitySchemas<T, U, V> | Entity schemas | undefined |
| searchConfig | SearchConfig | Search configuration | {} |

## OfflineIndicator

The `OfflineIndicator` component displays a banner when the device is offline.

### Usage

```jsx
import { OfflineIndicator } from '@pubflow/react-native';

function App() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineIndicator />
      <YourApp />
    </View>
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| style | StyleProp<ViewStyle> | Container style | undefined |
| textStyle | StyleProp<TextStyle> | Text style | undefined |
| text | string | Text to display | 'No internet connection' |
| position | 'top' \| 'bottom' | Position of the indicator | 'top' |
