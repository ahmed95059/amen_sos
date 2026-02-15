"""
Project: SoulSketch
File: pdf_generator/run_PDFG.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Entry point script for the PDF generation phase in the SoulSketch pipeline.
"""

import sys
from pathlib import Path
import subprocess
import shutil
import os

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# === CONFIGURATION ===
DEBUG_MODE = True

PDFG_STEPS = [
    "build_sources_folder.py",
    "build_full_report.py"
]

BASE_DIR = Path(__file__).resolve().parent
SOURCES_DIR = BASE_DIR / "sources"

# === Use current Python executable (already in the correct venv) ===
VENV_PYTHON = sys.executable

def run_script(script_name: str):
    """
    Runs a given Python script from this directory and captures its output.
    Uses the Python interpreter from .venv.
    """
    script_path = BASE_DIR / script_name
    print(f"\nRunning with .venv Python: {script_name}")

    result = subprocess.run(
        [str(VENV_PYTHON), str(script_path)],
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    if DEBUG_MODE:
        try:
            print(result.stdout)
        except UnicodeEncodeError:
            safe_output = result.stdout.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            print(safe_output)

    if result.returncode != 0:
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
    except Exception as e:
        print(f"[ERROR] PDF Generation failed: {e}")
    
    finally:
        clean_sources_folder()
        print("PDF Generation completed and sources folder cleaned.")
    


if __name__ == "__main__":
    run_pdf_generation()
