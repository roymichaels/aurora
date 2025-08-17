import io
import os
import tarfile

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

from .store import DB_PATH, CHROMA_PATH


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    """Derive a 32-byte AES key from the provided passphrase."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=200_000,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def export_backup(path: str, passphrase: str) -> None:
    """Export the memory database and embeddings as an encrypted archive."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        if os.path.exists(DB_PATH):
            tar.add(DB_PATH, arcname="memory.db")
        if os.path.exists(CHROMA_PATH):
            tar.add(CHROMA_PATH, arcname="chroma_db")
    data = buf.getvalue()

    salt = os.urandom(16)
    key = _derive_key(passphrase, salt)
    nonce = os.urandom(12)
    aes = AESGCM(key)
    ct = aes.encrypt(nonce, data, None)

    with open(path, "wb") as f:
        f.write(salt + nonce + ct)


def _safe_extract(tar: tarfile.TarFile, path: str) -> None:
    """Safely extract a tarfile to the given path."""
    for member in tar.getmembers():
        member_path = os.path.join(path, member.name)
        abs_target = os.path.abspath(path)
        abs_member = os.path.abspath(member_path)
        if not abs_member.startswith(abs_target):
            raise RuntimeError("Attempted Path Traversal in Tar File")
    tar.extractall(path)


def import_backup(path: str, passphrase: str) -> None:
    """Restore the memory database and embeddings from an encrypted archive."""
    with open(path, "rb") as f:
        raw = f.read()
    salt, nonce, ct = raw[:16], raw[16:28], raw[28:]
    key = _derive_key(passphrase, salt)
    aes = AESGCM(key)
    data = aes.decrypt(nonce, ct, None)

    buf = io.BytesIO(data)
    with tarfile.open(fileobj=buf, mode="r:gz") as tar:
        _safe_extract(tar, os.path.dirname(DB_PATH))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Backup or restore the memory store")
    parser.add_argument("command", choices=["export", "import"])
    parser.add_argument("path", help="Path to output (export) or input (import) file")
    parser.add_argument("--passphrase", required=True, help="Encryption passphrase")
    args = parser.parse_args()

    if args.command == "export":
        export_backup(args.path, args.passphrase)
    else:
        import_backup(args.path, args.passphrase)
