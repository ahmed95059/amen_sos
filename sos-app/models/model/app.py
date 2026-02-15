"""
Project: SoulSketch
File: app.py
Authors: Itay Vazana & Oriya Even Chen

Description:
This is the official Streamlit-based UI for the SoulSketch emotional analysis system.
It allows users to upload a drawing, run the full analysis pipeline, track real-time progress,
and download a ZIP containing the final PDF report and log.

Activation:
- Via run.bat from project root
- Or directly: streamlit run app.py
"""

import streamlit as st
from pathlib import Path
import tempfile
import zipfile
import threading
import time
import subprocess
from backend_app.upload_image import upload_image_to_shared
from backend_app.full_flow_runner import run_analysis_flow, get_current_step

# === CONFIGURATION ===
SHARED_INPUT = Path("shared_memory/0_BE_input/original_input.png")
FINAL_PDF = Path("shared_memory/7_PDFG_out/full_analysis_report.pdf")
LOG_DIR = Path("shared_memory/0_BE_out")
CLEANUP_SCRIPT = Path("shared_memory/clean_and_archive_current_data.py")
CLEAN_HISTORY_SCRIPT = Path("shared_memory/clean_history.py")

# === SESSION DEFAULTS ===
st.session_state.setdefault("cleanup_required", False)
st.session_state.setdefault("confirm_history_cleanup", False)

# === PAGE CONFIG ===
st.set_page_config(page_title="SoulSketch", layout="centered")

# === STYLE ===
st.markdown("""
    <style>
        body {
            background-color: #2b2b2b;
            color: white;
        }
        .stApp {
            background-color: #2b2b2b;
            color: white;
        }
        .title-text {
            font-size: 2.8rem;
            font-weight: bold;
            color: #eff19e;
            text-align: center;
            margin-top: 2rem;
        }
        .desc-text {
            font-size: 1.2rem;
            color: #ebebeb;
            text-align: center;
            padding: 0 10% 2rem 10%;
        }
        .stFileUploader p {
            color: #b7b4b4;
        }
        .stDownloadButton button {
            background-color: #f0f0f0;
            color: #111 !important;
            border: 1px solid #ccc;
            transition: all 0.3s ease-in-out;
        }
        .stDownloadButton button:hover {
            background-color: #e4e4e4;
            color: black !important;
            transform: scale(1.02);
            border: 1px solid #999;
        }
    </style>
""", unsafe_allow_html=True)

# === TITLE ===
st.markdown("<div class='title-text'>Welcome to SoulSketch</div>", unsafe_allow_html=True)
st.markdown(
    "<div class='desc-text'>"
    "SoulSketch is a modular system for psychological interpretation of children’s drawings. "
    "It uses deep learning, color analysis, comparative reasoning, and rule-based inference to generate "
    "insights about emotional states, all packed into an intuitive user experience with downloadable reports."
    "<br><br><h5>Upload the drawing · Get fast results · Understand better</h5>"
    "</div>", unsafe_allow_html=True
)

# === UTILITIES ===
def get_latest_log_file() -> Path | None:
    log_files = sorted(LOG_DIR.glob("flow_log_*.txt"), key=lambda f: f.stat().st_mtime, reverse=True)
    return log_files[0] if log_files else None

def read_last_error_from_log() -> str:
    log_path = get_latest_log_file()
    if log_path and log_path.exists():
        return log_path.read_text(encoding="utf-8")[-1000:]
    return "Unknown error."

def package_results_as_zip(drawing_id: str = "user") -> Path | None:
    if not FINAL_PDF.exists():
        return None
    latest_log = get_latest_log_file()
    zip_path = Path(tempfile.gettempdir()) / f"soulsketch_{drawing_id}.zip"
    with zipfile.ZipFile(zip_path, "w") as zipf:
        zipf.write(FINAL_PDF, arcname="full_analysis_report.pdf")
        if latest_log:
            zipf.write(latest_log, arcname="flow_log.txt")
    return zip_path

def run_analysis_in_thread():
    try:
        run_analysis_flow(verbose=True)
    except Exception as e:
        print(f"[THREAD ERROR] {e}")

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

# === FILE UPLOAD ===
st.markdown("---")
st.subheader("📂 Upload Drawing")
uploaded_file = st.file_uploader("Upload the drawing here", type=["jpg", "jpeg", "png"])

if uploaded_file is None:
    st.session_state.pop("report_ready", None)
    st.session_state.pop("cleanup_required", None)

if uploaded_file:
    st.image(uploaded_file, caption="Uploaded Drawing", use_column_width=True)

    if st.button("📤 Upload Image to System"):
        with st.spinner("Uploading..."):
            tmp_input_path = Path("tmp_uploaded_image.png")
            with open(tmp_input_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            result = upload_image_to_shared(str(tmp_input_path), verbose=True)
            tmp_input_path.unlink(missing_ok=True)

            if result["success"]:
                st.success("✅ Image uploaded successfully.")
            else:
                st.error(f"❌ Upload failed: {result['error']}")

# === MAINTENANCE ZONE ===
st.markdown("---")
st.subheader("🧰 Tools & Data Management")
col1, col2 = st.columns(2)

with col1:
    if st.button("🧹 Clear Temporary & Archive"):
        if CLEANUP_SCRIPT.exists():
            try:
                subprocess.run(["python", str(CLEANUP_SCRIPT)], check=True)
                st.success("✅ Workspace cleaned and archived.")
                st.session_state["cleanup_required"] = False
            except subprocess.CalledProcessError as e:
                st.warning(f"⚠️ Cleanup script failed: {e}")
        else:
            st.warning("⚠️ Cleanup script not found.")

with col2:
    with st.expander("🗑️ Clear History Folder"):
        if st.button("⚠️ Start History Cleanup", key="start_history_cleanup"):
            st.session_state["confirm_history_cleanup"] = True

        if st.session_state["confirm_history_cleanup"]:
            st.warning("⚠️ Are you sure you want to delete ALL past history?")
            confirm_radio = st.radio("Confirm action:", ["No", "Yes, I understand the risk"], index=0, key="radio_history_confirm")

            if confirm_radio == "Yes, I understand the risk":
                typed_input = st.text_input("To confirm, type exactly: SoulSketch", key="typed_confirm")

                if typed_input.strip() == "SoulSketch":
                    if st.button("✅ Final Confirmation – Delete History", key="final_confirm_history"):
                        if CLEAN_HISTORY_SCRIPT.exists():
                            try:
                                subprocess.run(["python", str(CLEAN_HISTORY_SCRIPT)], check=True)
                                st.success("✅ History folder was cleared successfully.")
                                st.session_state["confirm_history_cleanup"] = False
                            except subprocess.CalledProcessError as e:
                                st.error(f"❌ Failed to clear history: {e}")
                        else:
                            st.warning("⚠️ History cleanup script not found.")
                elif typed_input:
                    st.error("❌ Text does not match. Please type 'SoulSketch' exactly.")

# === WARNINGS ===
st.markdown("---")
if st.session_state.get("cleanup_required", False):
    st.warning("⚠️ Please clear temporary data before running a new analysis.")

# === RUN ANALYSIS ===
st.subheader("🧠 Run Emotional Analysis")
if st.button("🧠 Run Full Analysis", disabled=st.session_state.get("cleanup_required", False)):
    if not SHARED_INPUT.exists():
        st.error("❌ No image found in shared memory. Please upload before running analysis.")
        st.stop()

    analysis_thread = threading.Thread(target=run_analysis_in_thread)
    analysis_thread.start()

    status_area = st.empty()
    timer_area = st.empty()

    start_time = time.time()
    last_step = None

    with st.spinner("Running full analysis..."):
        while analysis_thread.is_alive():
            step = get_current_step()
            elapsed = int(time.time() - start_time)

            if step != last_step:
                last_step = step

            if step == "completed":
                status_area.success("✅ Analysis complete. Report is ready!")
                break
            else:
                status_area.info(f"🔄 {describe_step(step)}")

            timer_area.caption(f"⏱️ Elapsed time: {elapsed} seconds")
            time.sleep(0.5)

        analysis_thread.join()

        if FINAL_PDF.exists():
            status_area.success("✅ Analysis complete. Report is ready!")
            st.session_state["cleanup_required"] = True

# === DOWNLOAD SECTION ===
st.markdown("---")
st.subheader("📥 Download Results")
if st.session_state.get("cleanup_required", False):
    if FINAL_PDF.exists():
        with open(FINAL_PDF, "rb") as f:
            st.download_button(
                label="📥 Download PDF Report",
                data=f,
                file_name="emotional_analysis_report.pdf",
                mime="application/pdf"
            )
    else:
        st.info("ℹ️ Preparing your download... Please wait a few more seconds.")