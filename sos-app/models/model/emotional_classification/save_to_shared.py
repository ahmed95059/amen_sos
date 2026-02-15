"""
Project: SoulSketch
File: emotional_classification/save_to_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Handles saving the output of the emotional classification model
into the shared memory directory for later use by downstream modules.
"""

import sys
from pathlib import Path
import json

# ==== Project Root Resolution ====
# Ensures access to the project root path for consistent relative imports
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Output Paths Setup ====
# Define the output directory and JSON path for storing emotional classification results
EC_OUT_DIR = PROJECT_ROOT / "shared_memory" / "1_EC_out"
EC_OUT_DIR.mkdir(parents=True, exist_ok=True)
EC_JSON_PATH = EC_OUT_DIR / "EC_result.json"

# ==== Function: save_emotion_result ====
def save_emotion_result(result_dict: dict) -> None:
    """
    Saves emotional classification result to shared memory JSON file.

    Args:
        result_dict (dict): Dictionary containing keys 'label' (str) and 'confidence' (float).

    Returns:
        None
    """
    # Write the result to the defined JSON file path
    with EC_JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(result_dict, f, indent=4)

    # Confirmation log for debugging or tracking
    print(f"[INFO] Emotion JSON saved → {EC_JSON_PATH}")
