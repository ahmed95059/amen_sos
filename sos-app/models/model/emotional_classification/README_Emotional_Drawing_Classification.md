# 📁 Module: Emotional__Drawing_Classification

### 🎯 Purpose:
This module performs **emotional classification of an entire drawing** using a YOLO-based model.  
It determines the dominant emotional tone expressed in the drawing, generates a confidence plot, and saves the results for downstream usage.

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `run_yolo_EMCLS.py` | Main runner: loads YOLO classifier, performs prediction on the drawing, creates a confidence plot, and saves results. |
| `model_config.py` | Holds constants and configuration for the emotional model, including the emotion label list. |
| `save_to_shared.py` | Saves the classification result as a JSON to the shared memory folder for later use. |
| `plot_emotion_classification.py` | Generates a clean visual bar chart of the emotion confidence distribution. |
| `model/Yolo_Classifier.pt` | The trained YOLO model file used for emotion classification. |

---

## 🔁 Flow Summary:

1. **Input**:  
   The drawing is expected at:  
   `shared_memory/0_BE_input/original_input.png`

2. **Processing**:  
   - The image is contrast-enhanced.
   - Passed through the `Yolo_Classifier.pt` model.
   - Output probabilities and top emotion label are extracted.
   - A bar plot is generated visualizing the probabilities.

3. **Output**:  
   - Classification result (`label`, `confidence`) is saved to:  
     `shared_memory/1_EC_out/EC_result.json`
   - Plot is saved to:  
     `shared_memory/1_EC_out/plots/emotion_probs_plot.png`

---

## 🧠 Model Details:
- Architecture: YOLO-based custom classifier
- Labels supported:
  ```
  ['Anger', 'Calm', 'Fear', 'Happiness', 'Sadness', 'Surprise']
  ```

---

## 🧩 Dependencies:
- `ultralytics` (YOLOv8)
- `matplotlib`, `Pillow`, `OpenCV`, `numpy`
