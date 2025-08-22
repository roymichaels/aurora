# Data Backup

Aurora can create an encrypted archive of the local memory database so that your information can be preserved or migrated.

## Create a backup

1. Open **Settings** in the app.
2. Choose **Backup Data**.
3. Enter a passphrase and select where to save the file. An encrypted `.bin` archive will be written.

## Restore a backup

1. Ensure Aurora is closed.
2. Run the helper script, providing the path to the backup and the passphrase used during export:

```bash
python -m memory.backup import /path/to/backup.bin --passphrase "your-passphrase"
```

The command decrypts the archive and restores `memory.db` and `chroma_db` in the `memory/` directory.

> **Tip:** Running without Supabase credentials enables [offline mode](./offline-mode.md), so backups contain all current data.
