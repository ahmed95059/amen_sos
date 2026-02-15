"""
Project: SoulSketch
File   : backend_app/run_full_flow.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Runs the entire emotional analysis pipeline in sequential steps:
- Executes each submodule script in order
- Tracks current progress step in memory
- Logs output to file
- Supports real-time monitoring via get_current_step()
"""

import sys
from pathlib import Path
import subprocess
from datetime import datetime

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# === CONFIGURATION ===

FLOW_STEPS = [
    "run_yolo_EMCLS",
    "run_OBJ_DET",
    "run_FED",
    "run_CEX",
    "run_JB_A",
    "run_AG",
    "run_JB_B",
    "run_PDFG"
]

SCRIPT_PATHS = {
    "run_yolo_EMCLS": "emotional_classification/run_yolo_EMCLS.py",
    "run_OBJ_DET": "object_detection/run_OBJ_DET.py",
    "run_FED": "facial_expressions_detection/run_FED.py",
    "run_CEX": "colors_extractor/run_CEX.py",
    "run_JB_A": "json_builder/run_JB_A.py",
    "run_AG": "analysis_generator/run_AG.py",
    "run_JB_B": "json_builder/run_JB_B.py",
    "run_PDFG": "pdf_generator/run_PDFG.py"
}

BASE_DIR = PROJECT_ROOT
FINAL_PDF = BASE_DIR / "shared_memory/7_PDFG_out/full_analysis_report.pdf"
CURRENT_FLOW_STEP = "not_started"  # Global step tracker


def get_current_step() -> str:
    """
    Returns:
        str: Name of the current step being executed (or "completed").
    """
    return CURRENT_FLOW_STEP


def run_script(script_path: Path, script_alias: str, verbose: bool = False, log_file=None) -> None:
    """
    Runs a script by absolute path and logs output.

    Args:
        script_path (Path): Path to the .py script.
        script_alias (str): Human-readable label of the step.
        verbose (bool): If True, prints stdout to console.
        log_file (file): Log file to append output.
    """
    import platform

    header = f"[RUNNING] {script_path}"
    divider = "=" * len(header)

    print(f"\n{header}")
    if log_file:
        log_file.write(f"\n{divider}\n{header}\n{divider}\n")

    result = subprocess.run(
        [sys.executable, str(script_path.resolve())],
        cwd=BASE_DIR,
        shell=(platform.system() == "Windows"),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    output = result.stdout or "[NO OUTPUT RECEIVED]\n"
    output += f"[EXIT CODE] {result.returncode}\n"

    if verbose:
        print(output)
    if log_file:
        log_file.write(output)

    if result.returncode != 0:
        print(f"[ERROR] Error in {script_alias}")
        if log_file:
            log_file.write(f"[ERROR] Error in {script_alias}\n")
        raise RuntimeError(f"Script failed: {script_alias}")
    else:
        print(f"[SUCCESS] Finished: {script_alias}")
        if log_file:
            log_file.write(f"[SUCCESS] Finished: {script_alias}\n\n")


def run_analysis_flow(verbose: bool = True) -> dict:
    """
    Executes the full SoulSketch pipeline, step-by-step.

    Args:
        verbose (bool): Whether to print real-time output.

    Returns:
        dict: {"final_step": "completed"}
    """
    global CURRENT_FLOW_STEP

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_path = BASE_DIR / f"shared_memory/0_BE_out/flow_log_{timestamp}.txt"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    print("==================================================")
    print("[START] Starting Full Analysis Flow")
    print("==================================================")

    with open(log_path, "w", encoding="utf-8") as log_file:
        log_file.write("==================================================\n")
        log_file.write("[START] Full Analysis Flow Log\n")
        log_file.write(f"Started at: {timestamp}\n")
        log_file.write("==================================================\n")

        for step in FLOW_STEPS:
            CURRENT_FLOW_STEP = step
            script_rel_path = SCRIPT_PATHS[step]
            full_script_path = BASE_DIR / script_rel_path
            run_script(full_script_path, step, verbose=verbose, log_file=log_file)

        # Final PDF check
        log_file.write("\n==================================================\n")
        if FINAL_PDF.exists() and FINAL_PDF.stat().st_size > 0:
            with open(FINAL_PDF, "rb") as f:
                first_page = f.read(1000).decode("latin1", errors="ignore")
                if "PDF generation failed due to invalid input" in first_page:
                    log_file.write("[WARNING] PDF fallback generated due to invalid input.\n")
                else:
                    log_file.write("[SUCCESS] Full PDF report generated successfully.\n")
        else:
            log_file.write("[ERROR] No PDF file found or file is empty.\n")
        log_file.write("==================================================\n")

    CURRENT_FLOW_STEP = "completed"
    print(f"[LOG] Log saved to: {log_path.resolve()}")
    return {"final_step": "completed"}


if __name__ == "__main__":
    try:
        run_analysis_flow(verbose=True)
        print("\n[SUCCESS] Analysis pipeline completed successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Analysis pipeline failed: {e}")
        sys.exit(1)
