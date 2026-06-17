# Complete Route Coverage

`@pubflow/react-native` keeps `PubflowProvider` as the React Native integration point and exposes the complete backend clients through hooks:

```ts
const pay = useBridgePayments();
const forms = useUltraForms();

await pay.accountBalance.mine();
await pay.hosted.paymentMethodsUrl();
await forms.leads.hot();
await forms.lists.subscribe('newsletter', { email });
```

Use separate hosts when Bridge Payments and Ultra Forms are deployed independently:

```tsx
<PubflowProvider
  instances={{
    default: {
      baseUrl: 'https://flowless.example.com',
      apiUrl: 'https://flowless.example.com',
      paymentsUrl: 'https://payments.example.com',
      formsUrl: 'https://forms.example.com',
      modulePrefixes: {
        payments: '/bridge-payment',
        forms: '/api/v1',
      },
    },
  }}
>
  <App />
</PubflowProvider>
```

The route-to-method matrix is maintained in `@pubflow/core/docs/complete-route-coverage.md`. The React Native hooks mirror that shape with `useBridgePayments()`, `useUltraForms()`, `useBlog()`, and `useOnboarding()`.
