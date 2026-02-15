# 📂 shared_memory Directory – SoulSketch

**Project:** SoulSketch  
**Authors:** Itay Vazana & Oriya Even Chen

---

## 📦 Purpose

The `shared_memory/` directory acts as the central temporary storage location for all module outputs throughout the SoulSketch pipeline.

It holds both intermediate results and final outputs that are passed between processing stages (e.g., image analysis, emotional classification, JSON building, PDF generation).

---

## 📁 Folder Structure

- `0_BE_input/` → Raw input image (original drawing)
- `0_BE_out/` → Output of backend upload (optional logs or transformed input)
- `1_EC_out/` → Output of Emotional Classification module
- `2_OBJ_DET_out/` → Object Detection outputs (crops, metadata, plots)
- `3_FED_out/` → Facial Expressions Detection results
- `4_CEX_out/` → Color Extraction results (scene, objects, expressions)
- `5_JSON_out/` → Pre- and Post-analysis JSON outputs
- `6_AG_out/` → Textual emotional analysis outputs
- `7_PDFG_out/` → Final PDF report(s)
- `8_History/` → Archived snapshots of the above folders after each run

---

## 🧹 Cleanup & Archiving

The script `clean_and_archive_current_data.py`:

- Creates a timestamped archive under `8_History/` with a full snapshot of current state.
- Cleans all folders (except `8_History/` and the script itself) to prepare for the next run.

This ensures reproducibility and traceability across runs.

---

## 📤 Output Destination

The final result consumed by the frontend or backend is saved to:

```
shared_memory/7_PDFG_out/full_analysis_report.pdf
```