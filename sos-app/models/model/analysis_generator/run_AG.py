"""
Project: SoulSketch
File: analysis_generator/run_AG.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Entry point for the analysis_generator stage.
Calls the main function that reads pre_analysis.json and generates structured
textual output describing the emotional content of the drawing.
"""

import sys
from pathlib import Path

# ==== Resolve Project Root ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Execution ====
from analysis_generator import generate_analysis


def main() -> None:
    print("Running Analysis Generator...")
    generate_analysis()
    print("Analysis Generator finished.")


if __name__ == "__main__":
    main()
