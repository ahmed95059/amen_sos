"""
Project: SoulSketch
File: facial_expressions_detection/facial_cropper.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Utility for cropping facial expression regions from the original image
based on bounding boxes and saving them into individual PNG files.
"""

import sys
from pathlib import Path
import cv2
import os

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Function: crop_and_save_faces ====
def crop_and_save_faces(image_path, detections, output_dir):
    """
    Crops facial expression regions from an image and saves them as PNG files.

    Args:
        image_path (str or Path): Path to the input image.
        detections (List[Dict]): List of detection results with 'label' and 'bbox'.
        output_dir (str or Path): Directory where cropped images will be saved.

    Returns:
        None
    """
    image_path = Path(image_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image = cv2.imread(str(image_path))
    if image is None:
        raise FileNotFoundError(f"Image not found at: {image_path}")

    counter = {}
    for det in detections:
        label = det['label']
        x1, y1, x2, y2 = map(int, det['bbox'])
        crop = image[y1:y2, x1:x2]

        counter[label] = counter.get(label, 0) + 1
        filename = f"{label}_{counter[label]}.png"
        cv2.imwrite(str(output_dir / filename), crop)

    print(f"[INFO] Saved {sum(counter.values())} facial crops to {output_dir}")
