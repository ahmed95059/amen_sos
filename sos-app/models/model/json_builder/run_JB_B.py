"""
Project: SoulSketch
File: json_builder/run_JB_B.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Runs the second part of the JSON Builder segment.
This includes:
- Generating the final post_analysis.json file
- Combining structured pre-analysis with final textual output

Useful for debugging and testing the final data export format.
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
    "json_builder/build_post_analysis_format.py"
]


# ==== Script Runner ====
def run_script(script_path: str):
    """
    Runs a single Python script and prints its output.

    Args:
        script_path (str): Path to script relative to project root.
    """
    print(f"\nRunning: {script_path}")
    script = PROJECT_ROOT / script_path
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
        print(f"[ERROR] Script failed: {script_path}")
        raise RuntimeError(f"Script failed: {script_path}")
    else:
        print(f"[DONE] Script completed: {script_path}")


# ==== Main Flow ====
def run_json_builder_part_b():
    print("==================================================")
    print("Running JSON Builder - Part B")
    print("==================================================")
    for step in JB_STEPS:
        run_script(step)


# ==== Entry Point ====
if __name__ == "__main__":
    run_json_builder_part_b()
