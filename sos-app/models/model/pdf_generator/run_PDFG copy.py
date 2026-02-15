"""
Project: SoulSketch
File: pdf_generator/run_PDFG.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Entry point script for the PDF generation phase in the SoulSketch pipeline.

Responsibilities:
1. Executes `build_sources_folder.py` to prepare all required PDF assets
   from shared_memory (images, plots, JSONs).
2. Runs `build_full_report.py` to construct the full emotional analysis report.
3. Cleans up the intermediate `pdf_generator/sources` directory after completion.

Output:
- A fully composed, compressed PDF report saved at:
  shared_memory/7_PDFG_out/full_analysis_report.pdf
"""

import sys
from pathlib import Path
import subprocess
from PyPDF2 import PdfMerger
import shutil

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "SoulSketch":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# === CONFIGURATION ===
DEBUG_MODE = False

PDFG_STEPS = [
    "build_sources_folder.py",
    "build_full_report.py"
]

BASE_DIR = Path(__file__).resolve().parent
SOURCES_DIR = BASE_DIR / "sources"


def run_script(script_name: str):
    """
    Runs a given Python script from this directory and captures its output.
    Ensures the same Python environment (venv) is used.
    """
    script_path = BASE_DIR / script_name
    print(f"\nRunning: {script_name}")

    # Use the same Python interpreter as the current process
    python_exec = Path(sys.executable)

    result = subprocess.run(
        [str(python_exec), script_path.name],
        cwd=script_path.parent,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    print("Action terminated. _____________________________________________________")
    if DEBUG_MODE:
        try:
            print(result.stdout)
        except UnicodeEncodeError:
            safe_output = result.stdout.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            print(safe_output)

    if result.returncode != 0:
        print("result.returncode:", result.returncode)
        print(f"[ERROR] Script failed: {script_name}")
        raise RuntimeError(f"Script failed: {script_name}")
    else:
        print(f"[DONE] {script_name} completed successfully")


def clean_sources_folder():
    """
    Deletes the pdf_generator/sources folder to clean up after report generation.
    """
    if SOURCES_DIR.exists() and SOURCES_DIR.is_dir():
        shutil.rmtree(SOURCES_DIR)
        print(f"[CLEANUP] Deleted sources folder at: {SOURCES_DIR}")


def run_pdf_generation():
    print("=" * 50)
    print("       Starting PDF Generation Segment")
    print("=" * 50)

    try:
        for step in PDFG_STEPS:
            run_script(step)
    finally:
        clean_sources_folder()
        print("PDF Generation completed and sources folder cleaned.")


if __name__ == "__main__":
    run_pdf_generation()