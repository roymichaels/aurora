# Analytics Telemetry

The app can report anonymous usage telemetry to an analytics server. Telemetry
is **disabled in development** and when no endpoint is configured.

## Setup

1. Provide an HTTP endpoint that accepts a `POST` request with a JSON array of
   telemetry events. Each event contains:
   - `event`: name of the event
   - `data`: optional object payload
   - `ts`: timestamp in milliseconds
2. Set the `VITE_ANALYTICS_ENDPOINT` environment variable in your `.env` file to
   the URL of your analytics endpoint (e.g. `/api/analytics`).
3. Optionally set `VITE_ANALYTICS_ENABLED=false` to explicitly disable telemetry
   even when an endpoint exists.

The client sends events using `navigator.sendBeacon` when available or falls back
to `fetch()` with best-effort delivery. Non-OK responses and network errors are
silently ignored.
