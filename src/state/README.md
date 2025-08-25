# State Module

The state layer manages client-side application data such as keys, user
preferences and UI state.

## RNG requirement

`keyManager.ts` uses [`secrets.js-grempe`](https://www.npmjs.com/package/secrets.js-grempe)
for secret sharing. The library does not automatically use a
cryptographically secure random number generator, so it must be
initialized before generating key shards:

```ts
import secrets from 'secrets.js-grempe';
secrets.init();
secrets.setRNG('browserCryptoGetRandomValues');
```

If the RNG is not configured, shard generation will throw an error to
avoid silently falling back to an insecure source.
