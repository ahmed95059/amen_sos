"""
Project: SoulSketch
File: colors_extractor/input_processor.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Image preprocessing module for Color Extraction (CEX).
Includes contrast boosting, LAB-based enhancement,
and utility functions to load original drawing, object crops, and facial expression crops.
"""

import sys
from pathlib import Path
import cv2
import numpy as np
from typing import List, Tuple

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Preprocessing Functions ====
def boost_contrast_saturation(image: np.ndarray, alpha: float = 1.5, beta: int = 20) -> np.ndarray:
    """
    Applies contrast and brightness enhancement.

    Args:
        image (np.ndarray): Input image.
        alpha (float): Contrast factor.
        beta (int): Brightness offset.

    Returns:
        np.ndarray: Enhanced image.
    """
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

def enhance_lab_contrast(image: np.ndarray, clip_limit: float = 2.0, tile_grid_size=(8, 8)) -> np.ndarray:
    """
    Enhances contrast in LAB color space using CLAHE.

    Args:
        image (np.ndarray): Input BGR image.
        clip_limit (float): CLAHE clip limit.
        tile_grid_size (tuple): CLAHE tile grid size.

    Returns:
        np.ndarray: Enhanced BGR image.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_enhanced = clahe.apply(l)
    lab_enhanced = cv2.merge((l_enhanced, a, b))
    return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

def preprocess_for_cex(image: np.ndarray, mode: str = "lab") -> np.ndarray:
    """
    Dispatcher for image preprocessing before CEX.

    Args:
        image (np.ndarray): Input BGR image.
        mode (str): One of ['lab', 'boost'].

    Returns:
        np.ndarray: Preprocessed image.
    """
    if image is None or not isinstance(image, np.ndarray):
        raise ValueError("Invalid image provided for preprocessing")

    if mode == "boost":
        return boost_contrast_saturation(image)
    elif mode == "lab":
        return enhance_lab_contrast(image)
    else:
        raise ValueError(f"Unsupported preprocessing mode: {mode}")

# ==== Fixed Image Paths ====
ORIGINAL_IMAGE_PATH = PROJECT_ROOT / "shared_memory" / "0_BE_input" / "original_input.png"
COLORED_CROPS_DIR = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "objects" / "colored" / "crops"
FACIAL_CROPS_DIR = PROJECT_ROOT / "shared_memory" / "3_FED_out" / "facial_expressions" / "crops"

# ==== Loaders ====
def load_original_image() -> np.ndarray:
    """
    Loads the original drawing image.

    Returns:
        np.ndarray: Loaded image.
    """
    image = cv2.imread(str(ORIGINAL_IMAGE_PATH))
    if image is None:
        raise FileNotFoundError(f"Original input image not found at {ORIGINAL_IMAGE_PATH}")
    return image

def load_colored_crops() -> List[Tuple[str, str, np.ndarray]]:
    """
    Loads all cropped object images.

    Returns:
        List[Tuple[str, str, np.ndarray]]: List of (filename, object_type, image).
    """
    crops = []
    if not COLORED_CROPS_DIR.exists():
        print(f"[WARN] Object crops directory does not exist: {COLORED_CROPS_DIR}")
        return crops

    for file in sorted(COLORED_CROPS_DIR.glob("*.png")):
        filename = file.stem
        if "_" not in filename:
            continue
        crop_id, obj_type = filename.split("_", 1)
        image = cv2.imread(str(file))
        if image is not None:
            crops.append((filename, obj_type, image))
    return crops

def load_facial_expression_crops() -> List[Tuple[str, str, np.ndarray]]:
    """
    Loads all cropped facial expression images.

    Returns:
        List[Tuple[str, str, np.ndarray]]: List of (filename, expression_type, image).
    """
    crops = []
    if not FACIAL_CROPS_DIR.exists():
        print(f"[WARN] Facial crops directory does not exist: {FACIAL_CROPS_DIR}")
        return crops

    for file in sorted(FACIAL_CROPS_DIR.glob("*.png")):
        filename = file.stem
        if "_" not in filename:
            continue
        crop_id, expr_type = filename.split("_", 1)
        image = cv2.imread(str(file))
        if image is not None:
            crops.append((filename, expr_type, image))
    return crops
