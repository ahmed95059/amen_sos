"""
Project: SoulSketch
File: backend_app/main.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Runs the full analysis pipeline on a drawing image and returns a path to a ZIP file
containing the final PDF and flow log. This version does not use FastAPI or any server.
"""

import traceback
import tempfile
import zipfile
from pathlib import Path
from backend_app.full_flow_runner import run_analysis_flow, get_current_step
from backend_app.upload_image import upload_image_to_shared
from shared_memory.clean_and_archive_current_data import (
    archive_current_process,
    clean_all_except_history
)

# Paths
FINAL_PDF = Path("8_Shared_Memory/7_PDFG_out/full_analysis_report.pdf")
LOG_DIR = Path("8_Shared_Memory/0_BE_out")


def describe_step(step: str) -> str:
    mapping = {
        "not_started": "Starting analysis...",
        "run_yolo_EMCLS": "Detecting overall emotion...",
        "run_OBJ_DET": "Detecting objects in the drawing...",
        "run_FED": "Analyzing facial expressions...",
        "run_CEX": "Extracting color information...",
        "run_JB_A": "Preparing intermediate data...",
        "run_AG": "Generating emotional interpretation...",
        "run_JB_B": "Finalizing analysis data...",
        "run_PDFG": "Building the final PDF report...",
        "completed": "Analysis complete. Report is ready!"
    }
    return mapping.get(step, "Processing...")


def get_latest_log_file() -> Path | None:
    log_files = sorted(LOG_DIR.glob("flow_log_*.txt"), key=lambda f: f.stat().st_mtime, reverse=True)
    return log_files[0] if log_files else None


def run_full_analysis(input_image_path: str, drawing_id: str = "unknown") -> dict:
    """
    Uploads an image, runs the full analysis flow, and returns the path to the resulting ZIP file.
    """
    try:
        # Step 1: Upload and validate the image into shared memory
        result = upload_image_to_shared(input_image_path)
        if not result["success"]:
            return {"success": False, "error": result["error"]}

        # Step 2: Run the analysis
        run_analysis_flow()

        # Step 3: Check output
        if FINAL_PDF.exists() and FINAL_PDF.stat().st_size > 0:
            latest_log = get_latest_log_file()

            # Step 4: Create ZIP file with PDF and log
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
            with zipfile.ZipFile(tmp, "w") as zipf:
                zipf.write(FINAL_PDF, arcname="full_analysis_report.pdf")
                if latest_log:
                    zipf.write(latest_log, arcname="flow_log.txt")

            # Step 5: Archive and clean
            base_shared = FINAL_PDF.parent.parent
            archive_current_process(base_shared)
            clean_all_except_history(base_shared)

            return {
                "success": True,
                "zip_path": tmp.name,
                "step_description": describe_step(get_current_step())
            }

        else:
            return {"success": False, "error": "PDF was not generated correctly."}

    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}
