"""
Project: SoulSketch
File   : backend_app/input_validator.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Validation module for uploaded drawing images.
Provides three key checks:
1. File format validation
2. Content visibility (whiteness test)
3. Resolution threshold check
"""

import sys
from pathlib import Path
from PIL import Image

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# =============================================================================
# FORMAT VALIDATION
# =============================================================================

def is_valid_format(image_path: str, verbose: bool = True) -> bool:
    """
    Checks if the image file is in a valid and readable format.

    Args:
        image_path (str): Path to the image file.
        verbose (bool): Whether to print debug information.

    Returns:
        bool: True if the image format is valid, False otherwise.
    """
    try:
        with Image.open(image_path) as img:
            img.verify()
        if verbose:
            print(f"[VALID FORMAT] ✅ Image is readable: {image_path}")
        return True
    except Exception as e:
        if verbose:
            print(f"[VALID FORMAT] ❌ Invalid image format: {e}")
        return False

# =============================================================================
# CONTENT VISIBILITY CHECK (WHITENESS)
# =============================================================================

def is_mostly_white(
    image_path: str,
    white_threshold: int = 245,
    min_non_white_percent: float = 1.0,
    verbose: bool = True
) -> bool:
    """
    Determines if the image lacks visual content (i.e., mostly white).

    Args:
        image_path (str): Path to the image file.
        white_threshold (int): RGB value above which a pixel is considered white.
        min_non_white_percent (float): Minimum required percentage of non-white pixels.
        verbose (bool): Whether to print debug information.

    Returns:
        bool: True if the image is mostly white (invalid), False if it has enough content.
    """
    img = Image.open(image_path).convert('RGB')
    pixels = list(img.getdata())
    total_pixels = len(pixels)

    non_white_pixels = sum(
        1 for r, g, b in pixels if not (r >= white_threshold and g >= white_threshold and b >= white_threshold)
    )

    non_white_percent = (non_white_pixels / total_pixels) * 100
    if verbose:
        print(f"[WHITENESS CHECK] 🧪 Non-white pixel percentage: {round(non_white_percent, 2)}%")

    return non_white_percent < min_non_white_percent

# =============================================================================
# RESOLUTION CHECK
# =============================================================================

def is_resolution_too_small(
    image_path: str,
    min_width: int = 128,
    min_height: int = 128,
    verbose: bool = True
) -> bool:
    """
    Checks whether the image resolution is too small.

    Args:
        image_path (str): Path to the image file.
        min_width (int): Minimum allowed width in pixels.
        min_height (int): Minimum allowed height in pixels.
        verbose (bool): Whether to print debug information.

    Returns:
        bool: True if resolution is below threshold, False otherwise.
    """
    img = Image.open(image_path)
    width, height = img.size

    if verbose:
        print(f"[RESOLUTION CHECK] 📐 Image size: {width}x{height}")

    return width < min_width or height < min_height
