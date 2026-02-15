"""
Project: SoulSketch
File: facial_expressions_detection/save_to_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Helper utility for copying final facial expression outputs into
shared memory directory under a specified subfolder.
"""

import sys
from pathlib import Path
import shutil

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Function: save_to_shared_memory ====
def save_to_shared_memory(src_dir, target_subdir_name):
    """
    Copies all files and subfolders from a source directory to a specific shared memory subdirectory.

    Args:
        src_dir (str or Path): Path to the directory containing final outputs.
        target_subdir_name (str): Name of the subfolder to be created in shared_memory.

    Returns:
        None
    """
    src_dir = Path(src_dir)
    project_root = Path(__file__).resolve().parents[1]
    shared_base = project_root / "shared_memory" / target_subdir_name

    if shared_base.exists():
        shutil.rmtree(shared_base)
    shared_base.mkdir(parents=True, exist_ok=True)

    for item in src_dir.iterdir():
        dest = shared_base / item.name
        if item.is_file():
            shutil.copy2(item, dest)
        elif item.is_dir():
            shutil.copytree(item, dest)

    print(f"[INFO] Shared memory updated at {shared_base}")
