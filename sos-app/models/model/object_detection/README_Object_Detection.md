# 📁 Module: Object Detection

### 🎯 Purpose:
This module performs **YOLOv11-based object detection** on children's drawings. It extracts, analyzes, and stores cropped object instances along with their metadata and visual plots.

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `run_OBJ_DET.py` | Main pipeline runner: handles preprocessing, detection, crop saving, and visualization export. |
| `boxes_cropper.py` | Crops detected objects from the original image and saves them with metadata (position, size). |
| `filter_duplicate_objects.py` | Filters overlapping detections based on IoU, keeping only the most confident ones. |
| `input_processor.py` | Converts input images to a format optimized for detection (Canny edges, inversion, etc.). |
| `object_positioner.py` | Calculates the spatial position and relative size of each detected object. |
| `plot_yolo_detections.py` | Generates annotated images, class frequency plots, and confidence histograms. |
| `save_to_shared.py` | Copies final detection outputs into the project's shared memory directory. |
| `model/model_config.py` | Configuration file defining YOLO model path, class names, and thresholds. |
| `model/Yolo11s_HHT_trained.pt` | Trained YOLOv8 model file. |
| `model/data.yaml` | Training-time class definitions used to extract label names.

---

## 🔁 Flow Summary:

1. **Input**:  
   Drawing from: `shared_memory/0_BE_input/original_input.png`

2. **Processing**:
   - Image is preprocessed (grayscale → edge detection → inversion)
   - YOLO model detects objects
   - Each object is cropped from the **original image**
   - Metadata added: label, confidence, bounding box, position (grid), size (area)
   - Duplicate detections removed using IoU filtering
   - Visualization images (annotated image, bar chart, confidence histogram) are created

3. **Output**:
   - Crops + JSON metadata saved to:  
     `shared_memory/2_OBJ_DET_out/objects/colored/`
   - Plots saved to:  
     `shared_memory/2_OBJ_DET_out/plots/`

---

## 🧠 Model Info:
- Model: `model/Yolo11s_HHT_trained.pt`
- Labels (from `data.yaml`): auto-loaded into the module
- Thresholds:
  - Confidence ≥ 0.25
  - IoU for NMS: 0.45

---

## 🧩 Dependencies:
- `ultralytics` (YOLOv11)
- `opencv-python`
- `matplotlib`
- `numpy`
- `pyyaml`

