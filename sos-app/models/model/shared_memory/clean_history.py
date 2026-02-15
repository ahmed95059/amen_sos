"""
Project: SoulSketch
File   : shared_memory/clean_history.py
Authors: Itay Vazana & Oriya Even Chen
Modified by: Salma Ibn Cheikh

Description:
This script deletes all contents under `shared_memory/8_History`,
preserving the folder itself.
It also handles Windows permission issues (read-only, OneDrive locks, etc.).
"""

from pathlib import Path
import shutil
import os
import stat

EXCLUDED_FOLDER = "8_History"


# === Helper to remove read-only files (Windows fix) ===
def remove_readonly(func, path, _):
    """Force file/folder to be writable before deletion."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def clear_history_folder(base_path: Path) -> None:
    """
    Completely empties the contents of the '8_History' folder inside shared_memory.
    Deletes all subdirectories and files within it, but preserves the folder itself.
    """
    history_path = base_path / EXCLUDED_FOLDER

    if not history_path.exists():
        print("[INFO] History folder does not exist. Nothing to clear.")
        return

    for item in history_path.iterdir():
        try:
            if item.is_file():
                item.unlink()
                print(f"[DEL FILE] {item}")
            elif item.is_dir():
                shutil.rmtree(item, onerror=remove_readonly)
                print(f"[DEL DIR] {item}")
        except PermissionError as e:
            print(f"[SKIP - Permission Denied] {item}: {e}")
        except Exception as e:
            print(f"[ERROR] Failed to delete {item}: {e}")

    print("[DONE] '8_History' folder emptied successfully.")


if __name__ == "__main__":
    # Resolve project root from current file location
    shared_memory_path = Path(__file__).resolve().parent
    clear_history_folder(shared_memory_path)
