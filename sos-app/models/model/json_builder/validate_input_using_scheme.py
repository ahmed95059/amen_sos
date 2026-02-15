"""
Project: SoulSketch
File: json_builder/validate_input_using_scheme.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Validates a given JSON file against a defined JSON schema.
Supports colored CLI output and robust exception handling.
Used across the JSON Builder pipeline for validation of module outputs.
"""

import sys
from pathlib import Path
import json
from jsonschema import validate, ValidationError

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Color Output Support (Optional) ====
try:
    from colorama import Fore, Style, init
    init(autoreset=True)
    COLOR_ENABLED = True
except ImportError:
    COLOR_ENABLED = False
    class Fore:
        GREEN = RED = YELLOW = ""
    class Style:
        RESET_ALL = ""

# ==== JSON Validation Function ====
def validate_json_file(json_path: Path, schema_path: Path, verbose: bool = True) -> bool:
    """
    Validates a JSON file against a JSON schema.

    Args:
        json_path (Path): Path to the JSON file to validate.
        schema_path (Path): Path to the JSON schema definition.
        verbose (bool): Whether to print validation status.

    Returns:
        bool: True if validation passes, False otherwise.
    """
    if not json_path.exists():
        if verbose:
            print(f"{Fore.YELLOW}[ERROR]{Style.RESET_ALL} JSON file does not exist: {json_path}")
        return False

    if not schema_path.exists():
        if verbose:
            print(f"{Fore.YELLOW}[ERROR]{Style.RESET_ALL} Schema file does not exist: {schema_path}")
        return False

    try:
        with open(json_path, 'r', encoding="utf-8") as jf:
            instance = json.load(jf)
        with open(schema_path, 'r', encoding="utf-8") as sf:
            schema = json.load(sf)

        validate(instance=instance, schema=schema)

        if verbose:
            print(f"{Fore.GREEN}[VALID]{Style.RESET_ALL} {json_path.name} is valid against {schema_path.name}")
        return True

    except ValidationError as ve:
        if verbose:
            print(f"{Fore.RED}[INVALID]{Style.RESET_ALL} {json_path.name} failed validation:\n{ve.message}")
        return False

    except Exception as e:
        if verbose:
            print(f"{Fore.YELLOW}[ERROR]{Style.RESET_ALL} Failed to validate {json_path.name}: {e}")
        return False

# ==== Debug Mode Example ====
if __name__ == "__main__":
    validate_json_file(
        Path("json_builder/output/0_pre_analysis.json"),
        Path("json_builder/Schemes/0_pre_analysis_scheme.json")
    )
