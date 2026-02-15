"""
Project: SoulSketch
File   : shared_memory/clean_and_archive_current_data.py
Authors: Itay Vazana & Oriya Even Chen
Modified by: Salma Ibn Cheikh

Description:
Archives and cleans all contents under shared_memory/* except for:
- The '8_History' folder
- Python scripts (*.py)
- Markdown files (*.md)

It first creates a timestamped snapshot under '8_History',
then deletes all other content (files and folders), 
while safely handling Windows permission errors (OneDrive, etc.).
"""

import sys
import os
import shutil
import stat
from pathlib import Path
from datetime import datetime

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# === Constants ===
EXCLUDED_FOLDER = "8_History"
EXCLUDED_EXTENSIONS = [".py", ".md"]


# === Helper for deleting read-only files (Windows fix) ===
def remove_readonly(func, path, _):
    """Force file to writable before retrying deletion."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


# === Archive Function ===
def archive_current_process(base_path: Path) -> None:
    """
    Archives the current shared_memory folder (excluding Python and markdown files)
    into a timestamped subdirectory under '8_History'.
    """
    history_dir = base_path / EXCLUDED_FOLDER
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    archive_path = history_dir / timestamp

    history_dir.mkdir(exist_ok=True)
    archive_path.mkdir()

    for item in base_path.iterdir():
        if item.name == EXCLUDED_FOLDER:
            continue
        if item.suffix in EXCLUDED_EXTENSIONS:
            continue

        destination = archive_path / item.name
        try:
            if item.is_dir():
                shutil.copytree(item, destination)
            elif item.is_file():
                shutil.copy2(item, destination)
        except Exception as e:
            print(f"[SKIP ARCHIVE] {item}: {e}")

    print(f"[ARCHIVE] Snapshot created at: {archive_path}")


# === Cleanup Function ===
def clean_all_except_history(base_path: Path) -> None:
    """
    Empties all folders under shared_memory/* except:
    - The '8_History' folder
    - Python scripts (*.py)
    - Markdown files (*.md)

    Handles OneDrive permission issues gracefully.
    """
    for item in base_path.iterdir():
        if item.name == EXCLUDED_FOLDER:
            continue

        if item.suffix in EXCLUDED_EXTENSIONS:
            continue

        # === Delete single files ===
        if item.is_file():
            try:
                item.unlink()
                print(f"[DEL FILE] {item}")
            except Exception as e:
                print(f"[SKIP FILE] {item}: {e}")

        # === Delete folder contents ===
        elif item.is_dir():
            for sub_item in item.iterdir():
                if sub_item.suffix in EXCLUDED_EXTENSIONS and sub_item.is_file():
                    continue
                try:
                    if sub_item.is_file():
                        sub_item.unlink()
                        print(f"[DEL FILE] {sub_item}")
                    elif sub_item.is_dir():
                        shutil.rmtree(sub_item, onerror=remove_readonly)
                        print(f"[DEL FOLDER] {sub_item}")
                except Exception as e:
                    print(f"[SKIP] {sub_item}: {e}")

    print("[DONE] Folder content cleanup complete.")


# === Entry Point ===
if __name__ == "__main__":
    current_dir = Path(__file__).resolve().parent
    archive_current_process(current_dir)
    clean_all_except_history(current_dir)
