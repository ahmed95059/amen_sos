"""
Project: SoulSketch
File: facial_expression_detection/run_FED.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Main runner for facial expression detection from a drawing.
Performs model inference, filters results, saves expression crops,
generates plots, and copies all outputs to the shared memory.
"""

import sys
from pathlib import Path
import json
import shutil

from model.model_config import CONFIDENCE_THRESHOLD, IOU_THRESHOLD, FACIAL_EXPRESSIONS
from utils.detection_utils import load_model, filter_facial_expressions
from facial_cropper import crop_and_save_faces
from save_to_shared import save_to_shared_memory
from plot_yolo_exp_detections import generate_expression_plots

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Paths ====
BASE_PATH = Path(__file__).parent.resolve()
INPUT_IMAGE_PATH = BASE_PATH / "../shared_memory/0_BE_input/original_input.png"
OUTPUT_BASE = BASE_PATH / "temp"
OUTPUT_JSON = OUTPUT_BASE / "expressions.json"
OUTPUT_CROPS = OUTPUT_BASE / "crops"
OUTPUT_PLOTS = OUTPUT_BASE / "plots"
TEMP_DIR = BASE_PATH / "temp"
MODEL_PATH = BASE_PATH / "model" / "Yolo11s_FED_trained.pt"

# ==== Setup: Create/clean working directories ====
def setup_directories():
    """
    Creates and cleans the temp output directory.
    """
    OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
    for item in OUTPUT_BASE.iterdir():
        if item.is_file():
            item.unlink()
        elif item.is_dir():
            shutil.rmtree(item)

# ==== Cleanup: Remove temp directory after use ====
def clean_temp_directory():
    """
    Deletes the temp directory and its contents.
    """
    if TEMP_DIR.exists():
        for item in TEMP_DIR.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
        TEMP_DIR.rmdir()

# ==== Save Results to JSON ====
def save_results_to_json(detections):
    """
    Saves detection results to a JSON file for recordkeeping.

    Args:
        detections (list): List of expression detection dictionaries.

    Returns:
        None
    """
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(detections, f, indent=4)

# ==== Main Pipeline Entry Point ====
def main():
    print("[INFO] Starting facial expression detection pipeline...")
    setup_directories()

    print("[INFO] Loading model...")
    model = load_model(MODEL_PATH, CONFIDENCE_THRESHOLD, IOU_THRESHOLD)

    print("[INFO] Running detection...")
    results = model(str(INPUT_IMAGE_PATH))[0]

    print("[INFO] Filtering results...")
    detections = filter_facial_expressions(results, FACIAL_EXPRESSIONS)
    print(f"[INFO] {len(detections)} facial expressions detected.")

    print("[INFO] Saving detections to JSON...")
    save_results_to_json(detections)

    print("[INFO] Generating diagnostic plots...")
    generate_expression_plots(INPUT_IMAGE_PATH, detections, OUTPUT_PLOTS)

    print("[INFO] Cropping expression regions...")
    crop_and_save_faces(INPUT_IMAGE_PATH, detections, OUTPUT_CROPS)

    print("[INFO] Saving all outputs to shared memory...")
    save_to_shared_memory(OUTPUT_BASE, "3_FED_out/facial_expressions")

    print("[INFO] Facial expression detection pipeline completed successfully.")
    print("[INFO] Cleaning temp directory...")
    clean_temp_directory()

if __name__ == "__main__":
    main()
