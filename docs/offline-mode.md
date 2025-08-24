# Offline Mode

Aurora stores tasks, stats, and achievements locally in an encrypted RxDB database. Supabase synchronization has been removed, so all data stays on the device.

## Behavior
- No remote synchronization is performed.
- The app operates purely on local IndexedDB data.

## How to Handle It
Calling code should treat this as **offline-only** mode:
- Operate on the local data.
- Optionally notify the user that cloud sync is unavailable.

This setup is useful for privacy-sensitive environments or during development.
