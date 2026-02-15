"""
Project: SoulSketch
File: object_detection/object_positioner.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Analyzes the position and size of detected objects relative to the full image.
Adds 'position' and 'size' metadata to each object based on bounding box location and area.
"""

import sys
from pathlib import Path
from typing import Dict, Tuple

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Definitions for Size and Position ====
SIZES = ["small", "medium", "large"]
POSITIONS = [
    "top-left", "top-center", "top-right",
    "bottom-left", "bottom-center", "bottom-right"
]

# ==== Function: enrich_with_position_and_size ====
def enrich_with_position_and_size(obj: Dict, image_shape: Tuple[int, int]) -> Dict:
    """
    Adds 'position' and 'size' attributes to an object based on its bounding box.

    Args:
        obj (dict): Object dictionary with a 'bbox' field containing x1, y1, x2, y2.
        image_shape (tuple): The full image size as (height, width).

    Returns:
        dict: The updated object dictionary with added 'position' and 'size' fields.
    """
    height, width = image_shape
    bbox = obj["bbox"]

    # Determine center of bounding box
    cx = (bbox["x1"] + bbox["x2"]) / 2
    cy = (bbox["y1"] + bbox["y2"]) / 2

    # Determine position in a 2x3 grid
    col = 0 if cx < width / 3 else (2 if cx > 2 * width / 3 else 1)
    row = 0 if cy < height / 2 else 1
    position = POSITIONS[row * 3 + col]
    obj["position"] = position

    # Determine relative size category
    bbox_area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
    image_area = width * height
    ratio = bbox_area / image_area

    if ratio < 0.02:
        size = "small"
    elif ratio < 0.15:
        size = "medium"
    else:
        size = "large"

    obj["size"] = size
    return obj
