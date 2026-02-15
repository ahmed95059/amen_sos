"""
Project: SoulSketch
File: colors_extractor/save_to_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Copies final outputs from the color extraction module into the appropriate
subdirectory within the shared_memory folder for downstream access.
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
    Copies all contents from the given source directory into a target subdirectory
    within the shared_memory folder of the project.

    Args:
        src_dir (str or Path): The directory containing the final color extraction outputs.
        target_subdir_name (str): The name of the subdirectory to create under shared_memory.
    """
    src_dir = Path(src_dir)

    # Resolve target path under shared memory
    project_root = Path(__file__).resolve().parents[1]
    shared_base = project_root / "shared_memory" / target_subdir_name

    # Clear existing contents if present
    if shared_base.exists():
        shutil.rmtree(shared_base)
    shared_base.mkdir(parents=True, exist_ok=True)

    # Copy each file and folder into the destination
    for item in src_dir.iterdir():
        dest = shared_base / item.name
        if item.is_file():
            shutil.copy2(item, dest)
        elif item.is_dir():
            shutil.copytree(item, dest)

    print(f"[INFO] Shared memory updated at {shared_base}")
