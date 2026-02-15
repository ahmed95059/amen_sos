# 📁 Module: Facial Expressions Detection

### 🎯 Purpose:
This module detects **facial expressions** from the full drawing using a dedicated YOLOv11 model.  
It extracts regions of interest, filters by valid expression labels, and generates meaningful visualizations.

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `run_FED.py` | Main pipeline runner: loads model, detects expressions, filters results, saves crops & plots. |
| `model_config.py` | Configuration file containing detection thresholds and the expression label list. |
| `detection_utils.py` | Contains logic for loading YOLO and filtering out only valid facial expression detections. |
| `facial_cropper.py` | Crops detected facial expression areas and saves each one as a separate PNG. |
| `plot_yolo_exp_detections.py` | Generates annotated image, expression distribution chart, and confidence histogram. |
| `save_to_shared.py` | Copies all final outputs into the shared memory directory for downstream modules. |
| `model/Yolo11s_FED_trained.pt` | YOLOv8 model trained for facial expression detection. |
| `model/data.yaml` | Class label configuration used for the model's training and mapping.

---

## 🔁 Flow Summary:

1. **Input**:  
   Drawing from: `shared_memory/0_BE_input/original_input.png`

2. **Processing**:
   - YOLO model is loaded with appropriate thresholds.
   - Detection is run → results are filtered using known valid labels.
   - Each detected region is saved as a crop (PNG).
   - Visualizations are generated:
     - Annotated image with expression boxes
     - Expression type histogram
     - Confidence score histogram

3. **Output**:
   - JSON with all filtered detections:  
     `shared_memory/3_FED_out/facial_expressions/expressions.json`
   - Cropped facial expression images:  
     `shared_memory/3_FED_out/facial_expressions/crops/`
   - Plots:  
     `shared_memory/3_FED_out/facial_expressions/plots/`

---

## 😶 Labels Used in Detection:

```
[
    "angry_face", "happy_face", "sad_face", "neutral_face",
    "drawn_face", "hollow_eyes", "large_eyes", "angry_eyes",
    "dot_eyes", "far_eyes", "one_pupil"
]
```

---

## 🧩 Dependencies:
- `ultralytics` (YOLOv11)
- `opencv-python`
- `matplotlib`
- `numpy`
