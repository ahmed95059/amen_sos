"""
Project: SoulSketch
File: json_builder/run_JB_A.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Runs the first part of the JSON Builder segment.
Executes:
1. Data collection from shared_memory
2. Building the pre-analysis format JSON
Used in the analysis pipeline before generating final textual analysis.
"""

import sys
from pathlib import Path
import subprocess

# ==== Resolve Project Root ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Configuration ====
DEBUG_MODE = True
JB_STEPS = [
    "json_builder/get_data_from_shared.py",
    "json_builder/build_pre_analysis_format.py"
]

# ==== Script Runner ====
def run_script(script_path: str):
    """
    Runs a Python script and prints its output.

    Args:
        script_path (str): Relative path to script inside the repo.
    """
    print(f"\nRunning: {script_path}")
    script = Path(script_path)
    result = subprocess.run(
        [sys.executable, script.name],
        cwd=script.parent.resolve(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8"
    )

    if DEBUG_MODE:
        print(result.stdout)

    if result.returncode != 0:
        print(f"[ERROR] in {script_path}")
        raise RuntimeError(f"Script failed: {script_path}")
    else:
        print(f"[DONE] {script_path}")


# ==== Main Flow ====
def run_json_builder_part_a():
    print("==================================================")
    print("Running JSON Builder - Part A")
    print("==================================================")
    for step in JB_STEPS:
        run_script(step)


# ==== Entry Point ====
if __name__ == "__main__":
    run_json_builder_part_a()
