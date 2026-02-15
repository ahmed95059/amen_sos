"""
Project: SoulSketch
File: json_builder/get_data_from_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Collects all relevant module outputs from the shared_memory directory and returns a unified Python dictionary.
Includes schema validation for each loaded component.
Used for constructing pre-analysis and final output structures.
"""

import sys
from pathlib import Path
import json
from validate_input_using_scheme import validate_json_file

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Paths to Shared Memory Files ====
SHARED_BASE = PROJECT_ROOT / "shared_memory"

EC_PATH = SHARED_BASE / "1_EC_out/EC_result.json"
FED_PATH = SHARED_BASE / "3_FED_out/facial_expressions/expressions.json"
CEX_DRAWING_PATH = SHARED_BASE / "4_CEX_out/colors/JSON/drawing_results.json"
CEX_OBJECTS_PATH = SHARED_BASE / "4_CEX_out/colors/JSON/object_results.json"
CEX_EXPRESSIONS_PATH = SHARED_BASE / "4_CEX_out/colors/JSON/facial_expression_results.json"
OBJ_DET_DIR = SHARED_BASE / "2_OBJ_DET_out/objects/colored/jsons"

DRAWING_IMAGE_PATH = SHARED_BASE / "0_BE_input/original_input.png"
DRAWING_BW_IMAGE_PATH = SHARED_BASE / "0_BE_input/original_input_BW.png"

# ==== Schema Paths ====
SCHEMA_BASE = PROJECT_ROOT / "json_builder" / "Schemes" / "Moduls_Schemes"
SCHEMAS = {
    EC_PATH: SCHEMA_BASE / "EC_json_scheme.json",
    FED_PATH: SCHEMA_BASE / "FED_json_scheme.json",
    CEX_DRAWING_PATH: SCHEMA_BASE / "CEX_list_scheme.json",
    CEX_OBJECTS_PATH: SCHEMA_BASE / "CEX_dict_scheme.json",
    CEX_EXPRESSIONS_PATH: SCHEMA_BASE / "CEX_dict_scheme.json"
}


# ==== Load JSON with Optional Schema Validation ====
def load_json(path):
    """
    Loads a JSON file and optionally validates it against a known schema.

    Args:
        path (Path): Path to the JSON file.

    Returns:
        dict: Loaded JSON content or empty dict if missing.
    """
    if not path.exists():
        print(f"[WARN] Missing: {path}")
        return {}
    with open(path, 'r', encoding="utf-8") as f:
        data = json.load(f)
    schema = SCHEMAS.get(path)
    if schema:
        validate_json_file(path, schema)
    return data


# ==== Load Object Detection Results ====
def load_object_detection_data(obj_json_dir):
    """
    Loads all individual object JSON files from the given directory.

    Args:
        obj_json_dir (Path): Path to the folder with per-object metadata.

    Returns:
        dict: Mapping of object_id → object data.
    """
    data = {}
    if not obj_json_dir.exists():
        print(f"[WARN] Missing object detection JSONs: {obj_json_dir}")
        return data

    obj_schema = SCHEMA_BASE / "OBJ_DET_json_scheme.json"

    for json_file in sorted(obj_json_dir.glob("*.json")):
        object_id = json_file.stem
        validate_json_file(json_file, obj_schema)
        data[object_id] = load_json(json_file)

    return data


# ==== Aggregate Shared Data ====
def collect_all_shared_data():
    """
    Collects all structured outputs from shared_memory into a single dictionary.

    Returns:
        dict: Aggregated data from emotional classification, objects, expressions, and colors.
    """
    return {
        "drawing_image_path": str(DRAWING_IMAGE_PATH),
        "drawing_bw_image_path": str(DRAWING_BW_IMAGE_PATH),
        "emotional_classification": load_json(EC_PATH),
        "object_detection": load_object_detection_data(OBJ_DET_DIR),
        "facial_expressions": load_json(FED_PATH),
        "color_extraction": {
            "drawing": load_json(CEX_DRAWING_PATH),
            "objects": load_json(CEX_OBJECTS_PATH),
            "expressions": load_json(CEX_EXPRESSIONS_PATH)
        }
    }


# ==== Debug Entry Point ====
if __name__ == "__main__":
    result = collect_all_shared_data()
    print(json.dumps(result, indent=4, ensure_ascii=False))
