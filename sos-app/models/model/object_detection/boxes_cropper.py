"""
Project: SoulSketch
File: object_detection/boxes_cropper.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Handles cropping and saving detected objects from a full image.
Performs IoU-based filtering to avoid duplicates, enriches metadata, and saves crops and JSONs
into a structured shared memory output directory.
"""

import json
import cv2
import random
from pathlib import Path
from object_positioner import enrich_with_position_and_size
from filter_duplicate_objects import filter_detections_by_iou

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

# ==== Output Base Directory ====
BASE_OUTPUT_DIR = PROJECT_ROOT / "shared_memory" / "2_OBJ_DET_out" / "objects"

# ==== Function: generate_unique_id ====
def generate_unique_id(existing_ids: set, label: str) -> str:
    """
    Generates a unique ID for an object based on its label and random digits.

    Args:
        existing_ids (set): Set of already used IDs.
        label (str): The object class label.

    Returns:
        str: A new unique ID string.
    """
    while True:
        rand_digits = f"{random.randint(0, 9999):04d}"
        new_id = f"{rand_digits}_{label}"
        if new_id not in existing_ids:
            return new_id

# ==== Function: crop_and_save_objects ====
def crop_and_save_objects(image, detections, mode: str, iou_threshold: float = 0.6) -> list[str]:
    """
    Crops detected objects from an image and saves both images and JSON metadata.
    Applies IoU filtering to remove duplicate detections.

    Args:
        image: Input image as a NumPy array (BGR format).
        detections: List of dictionaries with detection data (label, confidence, bbox).
        mode (str): Either 'colored' or 'black_white'. Determines output folder.
        iou_threshold (float): Threshold for filtering overlapping objects.

    Returns:
        list[str]: List of object IDs saved.
    """
    if mode not in ["colored", "black_white"]:
        raise ValueError(f"Invalid mode '{mode}'. Must be 'colored' or 'black_white'.")

    # Setup output paths
    crops_dir = BASE_OUTPUT_DIR / mode / "crops"
    jsons_dir = BASE_OUTPUT_DIR / mode / "jsons"
    crops_dir.mkdir(parents=True, exist_ok=True)
    jsons_dir.mkdir(parents=True, exist_ok=True)

    height, width, _ = image.shape
    saved_ids = set()
    output_ids = []

    # Filter overlapping detections
    detections = filter_detections_by_iou(detections, threshold=iou_threshold)

    for obj in detections:
        label = obj["label"]
        conf = obj["confidence"]
        bbox = obj["bbox"]

        # Extract crop from image
        x1 = max(0, int(bbox["x1"]))
        y1 = max(0, int(bbox["y1"]))
        x2 = min(width, int(bbox["x2"]))
        y2 = min(height, int(bbox["y2"]))
        crop = image[y1:y2, x1:x2]

        if crop.size == 0:
            print(f"[SKIP] Empty crop for object '{label}'")
            continue

        # Generate and store ID
        object_id = generate_unique_id(saved_ids, label)
        saved_ids.add(object_id)
        output_ids.append(object_id)

        # Enrich metadata and save crop + JSON
        obj = enrich_with_position_and_size(obj, (height, width))
        obj["id"] = object_id
        crop_path = crops_dir / f"{object_id}.png"
        obj["crop_path"] = crop_path.as_posix()
        cv2.imwrite(str(crop_path), crop)

        json_path = jsons_dir / f"{object_id}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=4)

        print(f"[SAVED] {object_id} → {mode}")

    return output_ids
