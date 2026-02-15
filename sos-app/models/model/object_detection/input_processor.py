"""
Project: SoulSketch
File: object_detection/input_processor.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Handles preprocessing of input drawings prior to object detection.
Includes grayscale conversion, Gaussian blur, Canny edge detection,
optional erosion, polarity inversion, and final RGB format conversion.
"""

import sys
from pathlib import Path
import os
import cv2
import numpy as np

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Preprocessing Parameters ====
BLUR_KERNEL_SIZE = (7, 7)
CANNY_THRESHOLD_1 = 50
CANNY_THRESHOLD_2 = 150
EROSION_ITER = 0  # Set to 0 to disable erosion

# ==== Function: preprocess_image ====
def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    Applies a preprocessing pipeline to a BGR image: grayscale → blur → canny → optional erosion → invert → RGB.

    Args:
        image (np.ndarray): Input image in BGR format.

    Returns:
        np.ndarray: Preprocessed image in RGB format.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, BLUR_KERNEL_SIZE, 0)
    edges = cv2.Canny(blurred, CANNY_THRESHOLD_1, CANNY_THRESHOLD_2)

    if EROSION_ITER > 0:
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.erode(edges, kernel, iterations=EROSION_ITER)

    inverted = cv2.bitwise_not(edges)
    return cv2.cvtColor(inverted, cv2.COLOR_GRAY2RGB)

# ==== Function: preprocess_and_save ====
def preprocess_and_save(input_path: str, output_path: str) -> tuple[np.ndarray, np.ndarray]:
    """
    Loads an image from path, applies preprocessing, and saves the output.

    Args:
        input_path (str): Path to the original image.
        output_path (str): Path where the preprocessed image will be saved.

    Returns:
        tuple[np.ndarray, np.ndarray]: Tuple of (original image, preprocessed image).
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Image not found: {input_path}")

    image = cv2.imread(input_path)
    processed = preprocess_image(image)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, cv2.cvtColor(processed, cv2.COLOR_RGB2BGR))

    return image, processed
