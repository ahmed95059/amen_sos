"""
Project: SoulSketch
File: json_builder/build_post_analysis_format.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Creates the final post-analysis JSON file by combining:
- Pre-analysis structural data
- Textual emotional analysis results

Output is saved to: shared_memory/5_JSON_out/post_analysis.json
"""

from pathlib import Path
import json

# ==== Resolve Project Root ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

# ==== Path Definitions ====
PRE_PATH = PROJECT_ROOT / "shared_memory" / "5_JSON_out" / "pre_analysis.json"
ANALYSIS_PATH = PROJECT_ROOT / "shared_memory" / "6_AG_out" / "analysis_text.json"
OUTPUT_PATH = PROJECT_ROOT / "shared_memory" / "5_JSON_out" / "post_analysis.json"

# ==== Utility Function: load_json ====
def load_json(path: Path):
    """
    Loads a JSON file from the given path.

    Args:
        path (Path): Path to the JSON file.

    Returns:
        dict: Parsed JSON content.
    """
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))

# ==== Main Function ====
def main():
    print("[INFO] Building post-analysis format...")

    pre = load_json(PRE_PATH)
    text = load_json(ANALYSIS_PATH)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "pre_analysis": pre,
                "analysis_text": text.get("analysis_text") or text
            },
            ensure_ascii=False,
            indent=4
        ),
        encoding="utf-8"
    )

    print(f"[INFO] Post-analysis JSON saved to: {OUTPUT_PATH}")

# ==== Entry Point ====
if __name__ == "__main__":
    main()
