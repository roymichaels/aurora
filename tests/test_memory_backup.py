import shutil

from memory import backup


def test_export_import_round_trip(tmp_path):
    db_file = tmp_path / "memory.db"
    db_file.write_text("data")
    chroma_dir = tmp_path / "chroma_db"
    chroma_dir.mkdir()
    (chroma_dir / "vec").write_text("vector")

    backup.DB_PATH = str(db_file)
    backup.CHROMA_PATH = str(chroma_dir)

    backup_path = tmp_path / "backup.bin"
    backup.export_backup(str(backup_path), "pass")
    assert backup_path.exists()

    db_file.unlink()
    shutil.rmtree(chroma_dir)

    backup.import_backup(str(backup_path), "pass")
    assert db_file.exists()
    assert chroma_dir.exists()
