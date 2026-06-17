# Multi-Backend Modules

`@pubflow/react-native` supports the same multi-backend module setup as `@pubflow/react`, using the React Native storage adapter.

```tsx
import { PubflowProvider } from '@pubflow/react-native';

export function Root() {
  return (
    <PubflowProvider
      config={{
        id: 'mobile',
        baseUrl: 'https://flowless.example.com',
        paymentsUrl: 'https://payments.example.com',
        formsUrl: 'https://forms.example.com',
        useSecureStorage: true,
      }}
    >
      <App />
    </PubflowProvider>
  );
}
```

Use the friendly hooks:

```tsx
import { useBlog, useBridgePayments, useUltraForms } from '@pubflow/react-native';

const blog = useBlog();
const payments = useBridgePayments();
const forms = useUltraForms();

// await blog.listPosts({ lang: 'en' })
// await payments.createPaymentIntent(...)
// await forms.submitByCode('contact', values)
```

When a module is mounted under a different path, set `modulePrefixes` on the provider config.
