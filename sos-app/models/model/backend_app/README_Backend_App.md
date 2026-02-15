# 🧠 Module: Backend App

### 🎯 Purpose:
This module coordinates the **entire backend execution flow** of the SoulSketch system:  
from validating a user-submitted drawing image, through full pipeline execution, to result packaging and archival.  
It is used as a backend service or can run independently (non-API mode).

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `main.py` | Main entry point. Uploads image, runs full pipeline, returns ZIP with PDF + log. |
| `upload_image.py` | Validates and copies the uploaded image into `shared_memory/0_BE_input`. |
| `input_validator.py` | Provides low-level validation utilities (format, resolution, whiteness). |
| `full_flow_runner.py` | Executes each module script in defined order, tracks current step, logs progress. |

---

## 🔁 Flow Summary:

1. **Input Upload**  
   - Checks that the image:
     - Is a valid format (e.g., PNG, JPG)
     - Has enough visible (non-white) content
     - Meets minimum resolution (128x128)
   - Copies it to:  
     `shared_memory/0_BE_input/original_input.png`

2. **Pipeline Execution**  
   - Calls each module script (YOLO, OBJ DET, FED, CEX, JB, AG, PDFG) sequentially.
   - Logs output to:  
     `shared_memory/0_BE_out/flow_log_*.txt`
   - Tracks progress via `get_current_step()`.

3. **Packaging & Output**  
   - Merges final analysis report (`full_analysis_report.pdf`) and latest log.
   - Creates downloadable `.zip` file with both.
   - Archives old runs into:  
     `shared_memory/8_History/<timestamp>/`
   - Cleans temporary files from all other shared_memory folders.

---

## 🔐 Safety & Validation:

- Ensures invalid or empty drawings don’t enter pipeline.
- Automatically deletes or archives intermediate results to avoid memory clutter.

---

## 🧩 Dependencies:
- `Pillow`
- `zipfile`
- `subprocess`
- `datetime`
- `shutil`