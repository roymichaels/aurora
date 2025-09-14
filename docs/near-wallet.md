# NEAR Wallet Setup

To authenticate with a NEAR wallet in development, set the following environment variables in your `.env` file:

```
VITE_NEAR_NETWORK_ID=testnet
VITE_NEAR_NODE_URL=https://rpc.testnet.near.org
VITE_NEAR_WALLET_URL=https://wallet.testnet.near.org
VITE_NEAR_HELPER_URL=https://helper.testnet.near.org
```

These defaults connect to the NEAR testnet. Use mainnet endpoints if you deploy to production.
