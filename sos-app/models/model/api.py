"""
Project: SoulSketch
File: api.py
Authors: Adapted from Itay Vazana & Oriya Even Chen
Description:
Flask-based API backend for SoulSketch.
This replaces the Streamlit UI and exposes REST endpoints for integration with a frontend.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pathlib import Path
import tempfile
import zipfile
import threading
import subprocess
import sys  # ✅ Utilisé pour exécuter les scripts dans le même venv

# === Import SoulSketch backend logic ===
from backend_app.upload_image import upload_image_to_shared
from backend_app.full_flow_runner import run_analysis_flow, get_current_step

# === CONFIGURATION ===
SHARED_INPUT = Path("shared_memory/0_BE_input/original_input.png")
FINAL_PDF = Path("shared_memory/7_PDFG_out/full_analysis_report.pdf")
LOG_DIR = Path("shared_memory/0_BE_out")
CLEANUP_SCRIPT = Path("shared_memory/clean_and_archive_current_data.py")
CLEAN_HISTORY_SCRIPT = Path("shared_memory/clean_history.py")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)


status = {"step": "not_started", "running": False}


# === UTILITIES ===
def get_latest_log_file() -> Path | None:
    """Return the most recent log file."""
    log_files = sorted(LOG_DIR.glob("flow_log_*.txt"), key=lambda f: f.stat().st_mtime, reverse=True)
    return log_files[0] if log_files else None


def package_results_as_zip(drawing_id: str = "user") -> Path | None:
    """Bundle PDF and log into a downloadable ZIP."""
    if not FINAL_PDF.exists():
        return None

    latest_log = get_latest_log_file()
    zip_path = Path(tempfile.gettempdir()) / f"soulsketch_{drawing_id}.zip"

    with zipfile.ZipFile(zip_path, "w") as zipf:
        zipf.write(FINAL_PDF, arcname="full_analysis_report.pdf")
        if latest_log:
            zipf.write(latest_log, arcname="flow_log.txt")

    return zip_path


# === ROUTES ===

@app.route("/")
def home():
    return jsonify({"message": "✅ SoulSketch API is running."})


@app.route("/api/upload", methods=["POST"])
def upload():
    """Upload a drawing image to shared memory."""
    file = request.files.get("image")
    if not file:
        return jsonify({"success": False, "error": "No image provided."}), 400

    tmp_path = Path("tmp_uploaded_image.png")
    file.save(tmp_path)

    try:
        upload_image_to_shared(str(tmp_path), verbose=True)
        tmp_path.unlink(missing_ok=True)
        return jsonify({"success": True, "message": "Image uploaded successfully."})
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        return jsonify({"success": False, "error": str(e)}), 500



@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Start the full analysis in a background thread."""
    if status["running"]:
        return jsonify({"success": False, "error": "Analysis already in progress."}), 409

    def run_flow():
        try:
            status["running"] = True
            status["step"] = "started"
            run_analysis_flow(verbose=True)
            status["step"] = "completed"
        except Exception as e:
            status["step"] = f"error: {e}"
        finally:
            status["running"] = False

    threading.Thread(target=run_flow, daemon=True).start()
    return jsonify({"success": True, "message": "Analysis started."})


@app.route("/api/status", methods=["GET"])
def analysis_status():
    """Return current pipeline step."""
    step = get_current_step()
    status["step"] = step
    return jsonify(status)


@app.route("/api/download", methods=["GET"])
def download_results():
    """Provide the final ZIP for download."""
    zip_path = package_results_as_zip()
    if zip_path and zip_path.exists():
        return send_file(zip_path, as_attachment=True)
    return jsonify({"error": "No results available yet."}), 404


@app.route("/api/cleanup", methods=["POST"])
def cleanup():
    """Run cleanup script to clear temp data."""
    if CLEANUP_SCRIPT.exists():
        subprocess.run([sys.executable, str(CLEANUP_SCRIPT)], check=False)  # ✅ Utilise le même venv
        return jsonify({"success": True, "message": "Cleanup completed."})
    return jsonify({"success": False, "error": "Cleanup script not found."}), 404


@app.route("/api/clear-history", methods=["POST"])
def clear_history():
    """Delete history folder."""
    if CLEAN_HISTORY_SCRIPT.exists():
        subprocess.run([sys.executable, str(CLEAN_HISTORY_SCRIPT)], check=False)  # ✅ Utilise le même venv
        return jsonify({"success": True, "message": "History cleared."})
    return jsonify({"success": False, "error": "History cleanup script not found."}), 404


# === RUN SERVER ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6000)
