# State Module

The state layer manages client-side application data such as keys, user
preferences and UI state.

## RNG requirement

`keyManager.ts` uses [`secrets.js-grempe`](https://www.npmjs.com/package/secrets.js-grempe)
for secret sharing. The library is loaded dynamically only in browser
environments that expose `crypto.getRandomValues`:

```ts
if (typeof window !== 'undefined' && globalThis.crypto?.getRandomValues) {
  const { default: secrets } = await import('secrets.js-grempe/lib/secrets.js');
  secrets.init();
  secrets.setRNG('browserCryptoGetRandomValues');
}
```

If a secure random number generator is unavailable, shard generation will
throw an error instead of silently falling back to an insecure source.
