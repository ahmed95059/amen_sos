"""
Project: SoulSketch
File: json_builder/build_pre_analysis_format.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Builds the pre-analysis JSON format from collected shared memory data.
Combines results from emotion classification, object detection, facial expressions,
and color extraction into a single validated structure.
"""

import sys
from pathlib import Path
import json
import uuid

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Imports ====
from get_data_from_shared import collect_all_shared_data
from maps.color_emotion_mapping import EXPRESSION_EMOTION_MAP
from validate_input_using_scheme import validate_json_file

# ==== Paths ====
OUTPUT_PATH = PROJECT_ROOT / "shared_memory" / "5_JSON_out" / "pre_analysis.json"
SCRIPT_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = SCRIPT_DIR / "Schemes" / "pre_analysis_scheme.json"

OBJECT_CROP_PATH = "shared_memory/2_OBJ_DET_out/objects/colored/crops"
EXPRESSION_CROP_PATH = "shared_memory/3_FED_out/facial_expressions/crops"

# ==== Object Entry Builder ====
def build_object_entry(obj_id, obj_data, color_data):
    """
    Creates a structured entry for a detected object.

    Args:
        obj_id (str): Object unique ID.
        obj_data (dict): Metadata about the object.
        color_data (dict): Color analysis results for objects.

    Returns:
        dict: Pre-analysis object entry.
    """
    colors = color_data.get(obj_id, [])
    dom_color = colors[0] if colors else None
    confidence = round(obj_data.get("confidence", 0.0), 3) if obj_data.get("confidence") is not None else None

    return {
        "id": obj_id,
        "type": obj_data.get("label") or "unknown",
        "position": obj_data.get("position") or "unknown",
        "size": obj_data.get("size") or "unknown",
        "dominant_expression": obj_data.get("expression"),
        "dominant_emotion_hint": obj_data.get("emotion_hint"),
        "dominant_emotion_color": dom_color.get("emotion") if dom_color else None,
        "is_color_unusual": dom_color.get("is_unusual") if dom_color else False,
        "colors": colors,
        "crop_path": f"{OBJECT_CROP_PATH}/{obj_id}.png",
        "confidence": confidence
    }

# ==== Expression Entry Builder ====
def build_expression_entry(expr, expr_colors):
    """
    Creates a structured entry for a detected facial expression.

    Args:
        expr (dict): Expression metadata.
        expr_colors (dict): Color analysis results for expressions.

    Returns:
        dict: Pre-analysis expression entry.
    """
    expr_name = expr.get("name") or expr.get("label") or "unknown_expression"
    expr_id = expr.get("id") or f"expr_{str(uuid.uuid4())[:8]}"
    emotion_list = EXPRESSION_EMOTION_MAP.get(expr_name)
    emotion = emotion_list[0] if emotion_list else "Unknown"
    confidence = round(expr.get("confidence", 0.0), 3) if expr.get("confidence") is not None else None
    colors = expr_colors.get(expr_id, [])

    return {
        "id": expr_id,
        "expression": expr_name,
        "mapped_emotion": emotion,
        "dominant_emotion_color": None,
        "colors": colors,
        "crop_path": f"{EXPRESSION_CROP_PATH}/{expr_id}.png",
        "confidence": confidence
    }

# ==== Main Execution ====
def main():
    print("[INFO] Building pre-analysis format...")
    data = collect_all_shared_data()

    if not SCHEMA_PATH.exists():
        print(f"[ERROR] Schema file not found at: {SCHEMA_PATH.resolve()}")
        return

    ec = data["emotional_classification"]
    general_emotion = ec.get("emotion") or ec.get("label") or "Unknown"
    general_confidence = round(ec.get("confidence", 0.0), 3) if ec.get("confidence") is not None else None

    object_entries = [
        build_object_entry(obj_id, obj_data, data["color_extraction"]["objects"])
        for obj_id, obj_data in data["object_detection"].items()
    ]

    expression_entries = [
        build_expression_entry(expr, data["color_extraction"]["expressions"])
        for expr in data["facial_expressions"]
    ]

    pre_analysis = {
        "general_emotion": general_emotion,
        "general_emotion_confidence": general_confidence,
        "drawing_image_path": data["drawing_image_path"],
        "drawing_bw_image_path": data["drawing_bw_image_path"],
        "objects": object_entries,
        "facial_expressions": expression_entries,
        "dominant_drawing_colors": data["color_extraction"].get("drawing", [])
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(pre_analysis, f, indent=4)

    print(f"[INFO] Pre-analysis JSON saved to: {OUTPUT_PATH}")
    print("[INFO] Validating pre-analysis JSON against schema...")
    validate_json_file(OUTPUT_PATH, SCHEMA_PATH)

# ==== Entry Point ====
if __name__ == "__main__":
    main()
