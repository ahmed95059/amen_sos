"""
Project: SoulSketch
File: object_detection/save_to_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Copies object crops and their JSON descriptors from the object detection module's
'colored' output folder into the shared memory structure used by the system.
Intended for consistent access across pipeline modules.
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

# ==== Path Definitions ====
DETECT_OUT_DIR = PROJECT_ROOT / "object_detection" / "output" / "colored"
CROPS_SRC = DETECT_OUT_DIR / "crops"
JSONS_SRC = DETECT_OUT_DIR / "jsons"

CROPS_DST = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "objects" / "colored" / "crops"
JSONS_DST = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "objects" / "colored" / "jsons"

# ==== Function: copy_folder ====
def copy_folder(src: Path, dst: Path) -> None:
    """
    Copies all files from a source directory to a destination directory.

    Args:
        src (Path): Source folder path.
        dst (Path): Destination folder path.

    Returns:
        None
    """
    if not src.exists():
        print(f"[WARN] Source folder does not exist: {src}")
        return

    dst.mkdir(parents=True, exist_ok=True)
    for item in src.iterdir():
        if item.is_file():
            shutil.copy2(item, dst / item.name)
            print(f"[COPY] {item.name}  →  {dst}")

# ==== Function: save_object_outputs_to_shared ====
def save_object_outputs_to_shared() -> None:
    """
    Copies cropped object images and their metadata JSONs to the shared memory directory.

    Returns:
        None
    """
    print("Copying object crops …")
    copy_folder(CROPS_SRC, CROPS_DST)

    print("Copying object JSONs …")
    copy_folder(JSONS_SRC, JSONS_DST)

    print("Finished copying object outputs to shared_memory.")

# ==== Script Entry Point ====
if __name__ == "__main__":
    save_object_outputs_to_shared()
