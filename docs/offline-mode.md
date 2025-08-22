# Offline Mode

Aurora's sync helpers immediately resolve when Supabase credentials are missing. This allows the app to operate purely on local data without attempting any remote operations.

## Behavior
- Functions like `pushToSupabase` and `pullFromSupabase` check the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
- If either variable is absent, the function returns early without contacting Supabase.

## How to Handle It
Calling code should treat this as **offline-only** mode:
- Skip any remote synchronization steps.
- Operate on the local IndexedDB data.
- Optionally notify the user that cloud sync is disabled.

This setup is useful for privacy-sensitive environments or during development when Supabase is not configured.
