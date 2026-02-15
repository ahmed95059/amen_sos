"""
Project: SoulSketch
File: colors_extractor/run_CEX.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Main runner for extracting emotional colors from drawing, object crops, and facial expression crops.
Performs preprocessing, color clustering, emotion mapping, and diagnostic plot generation.
Final outputs (JSONs + plots) are copied into shared_memory for use by downstream modules.
"""

import sys
from pathlib import Path
import json
import shutil

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Imports ====
from input_processor import (
    load_original_image,
    load_colored_crops,
    load_facial_expression_crops,
    preprocess_for_cex
)
from models.KNN_model import extract_emotional_colors
from save_to_shared import save_to_shared_memory

# ==== Constants and Paths ====
TEMP_DIR = Path("temp")
JSON_DIR = TEMP_DIR / "JSON"
PLOTS_DIR = TEMP_DIR / "plots"

DRAWING_JSON = JSON_DIR / "drawing_results.json"
OBJECTS_JSON = JSON_DIR / "object_results.json"
EXPRESSIONS_JSON = JSON_DIR / "facial_expression_results.json"

SHARED_SUBDIR = "4_CEX_out/colors"
PREPROCESS_MODE = "lab"  # Options: 'lab' or 'boost'


# ==== Setup Directories ====
def setup_directories():
    """
    Ensures the temporary working directory is clean and prepared.
    """
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)


# ==== Save JSON Utility ====
def save_json(data, path):
    """
    Saves the given data to a JSON file.

    Args:
        data (dict or list): The data to serialize.
        path (Path): Target JSON file path.
    """
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)


# ==== Cleanup Temporary Directory ====
def clean_temp():
    """
    Deletes the temporary working directory.
    """
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)


# ==== Main Pipeline ====
def main():
    print("[INFO] Starting color extraction pipeline (CEX)...")
    setup_directories()

    # === Full Drawing ===
    print("[INFO] Processing original drawing...")
    full_image = load_original_image()
    processed_full = preprocess_for_cex(full_image, mode=PREPROCESS_MODE)
    drawing_colors = extract_emotional_colors(
        image=processed_full,
        output_dir=PLOTS_DIR,
        entity_type="drawing"
    )
    save_json(drawing_colors, DRAWING_JSON)

    # === Object Crops ===
    print("[INFO] Processing object crops...")
    object_results = {}
    for crop_name, obj_type, image in load_colored_crops():
        processed_crop = preprocess_for_cex(image, mode=PREPROCESS_MODE)
        result = extract_emotional_colors(
            image=processed_crop,
            output_dir=PLOTS_DIR,
            entity_type="object",
            entity_id=crop_name,
            object_type=obj_type
        )
        object_results[crop_name] = result
    save_json(object_results, OBJECTS_JSON)

    # === Facial Expression Crops ===
    print("[INFO] Processing facial expression crops...")
    expression_results = {}
    for crop_name, expr_type, image in load_facial_expression_crops():
        processed_expr = preprocess_for_cex(image, mode=PREPROCESS_MODE)
        result = extract_emotional_colors(
            image=processed_expr,
            output_dir=PLOTS_DIR,
            entity_type="expression",
            entity_id=crop_name
        )
        expression_results[crop_name] = result
    save_json(expression_results, EXPRESSIONS_JSON)

    # === Save to Shared Memory ===
    print("[INFO] Saving results to shared memory...")
    save_to_shared_memory(TEMP_DIR, SHARED_SUBDIR)

    # === Cleanup ===
    print("[INFO] Cleaning up temp directory...")
    clean_temp()

    print("[INFO] Color extraction pipeline completed successfully.")


# ==== Entry Point ====
if __name__ == "__main__":
    main()
