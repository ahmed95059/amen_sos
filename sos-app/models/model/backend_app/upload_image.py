"""
Project: SoulSketch
File   : backend_app/upload_image.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Provides functionality to:
- Validate user-uploaded drawing images (format, content, resolution)
- Copy valid image into shared memory under a consistent name: 'original_input.png'
"""

import sys
from pathlib import Path
import shutil
from backend_app.input_validator import (
    is_valid_format,
    is_mostly_white,
    is_resolution_too_small
)

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# =============================================================================
# MAIN FUNCTION
# =============================================================================

def upload_image_to_shared(
    image_path: str,
    shared_dir: Path = PROJECT_ROOT / "shared_memory" / "0_BE_input",
    verbose: bool = True
) -> dict:
    """
    Validates the image and copies it to the shared memory input folder
    as 'original_input.png'.

    Args:
        image_path (str): Path to the input image.
        shared_dir (Path): Path to the shared memory input folder.
        verbose (bool): Whether to print debug information.

    Returns:
        dict: {
            "success": bool,
            "path": str (if success),
            "error": str (if failed)
        }
    """
    source_path = Path(image_path)
    if not source_path.is_file():
        return {"success": False, "error": f"Image not found: {source_path}"}

    if not is_valid_format(str(source_path), verbose=verbose):
        return {"success": False, "error": "Uploaded file is not a valid image format."}

    if is_mostly_white(str(source_path), verbose=verbose):
        return {"success": False, "error": "Uploaded image is mostly white or empty."}

    if is_resolution_too_small(str(source_path), verbose=verbose):
        return {"success": False, "error": "Uploaded image resolution is too small. Minimum 128x128 required."}

    try:
        shared_dir.mkdir(parents=True, exist_ok=True)
        target_path = shared_dir / "original_input.png"
        shutil.copy2(source_path, target_path)

        if verbose:
            print(f"✅ Image copied to shared memory as: {target_path}")

        return {"success": True, "path": str(target_path)}
    except Exception as e:
        return {"success": False, "error": str(e)}
