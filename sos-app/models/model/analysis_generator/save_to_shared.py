"""
Project: SoulSketch
File: analysis_generator/save_to_shared.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Helper utility for saving emotional analysis JSON output into the appropriate
shared_memory directory (6_AG_out).
Used by generate_analysis.py to persist the generated narrative.
"""

import sys
from pathlib import Path
import json
from typing import Union

# ==== Resolve Project Root ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Save Function ====
def save_analysis_output(data: dict, filename: Union[str, Path] = "analysis_text.json") -> Path:
    """
    Save *data* (as JSON) to shared_memory/6_AG_out/<filename>.

    Args:
        data (dict): The JSON-serializable analysis result.
        filename (str | Path): Name of the file to write (default is analysis_text.json).

    Returns:
        Path: Absolute path to the written file.
    """
    output_dir = PROJECT_ROOT / "shared_memory" / "6_AG_out"
    output_dir.mkdir(parents=True, exist_ok=True)

    out_path = output_dir / filename
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"[INFO] Analysis JSON saved to: {out_path}")
    return out_path
