# 📁 Module: Colors Extractor (CEX)

### 🎯 Purpose:
This module analyzes the **dominant colors** in the full drawing, object crops, and facial expression crops.  
It maps these colors to emotional meanings using predefined associations and generates visual plots and JSON summaries  
that reflect emotional tones across the artwork.

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `run_CEX.py` | Orchestrates the full color extraction flow across all image types. Saves plots and JSON outputs. |
| `models/KNN_model.py` | Core logic for extracting and mapping colors to emotions. Also generates dual diagnostic plots. |
| `models/models_config.py` | Contains mappings for colors ↔ emotions, object color expectations, and allowed schema values. |
| `models/plot_color_emotions.py` | Draws the RGB→Emotion map + pie chart of proportions per entity (drawing/object/expression). |
| `input_processor.py` | Applies preprocessing and loads crops/images from shared_memory for CEX processing. |
| `save_to_shared.py` | Moves all final outputs to `shared_memory/4_CEX_out/colors`. |

---

## 🔁 Flow Summary:

1. **Input**:  
   - Drawing: `shared_memory/0_BE_input/original_input.png`  
   - Object Crops: `shared_memory/2_OBJ_DET_out/objects/colored/crops/`  
   - Facial Expression Crops: `shared_memory/3_FED_out/facial_expressions/crops/`

2. **Processing**:
   - Applies CLAHE (LAB) or contrast boosting.
   - Runs KMeans clustering to find dominant RGB colors.
   - Maps colors to emotion labels using defined ranges.
   - Checks whether colors are "unusual" for object types.
   - Generates plots (RGB→Emotion + pie) for each entity.

3. **Output**:
   - JSONs for drawing, objects, and expressions in:  
     `shared_memory/4_CEX_out/colors/JSON/`
   - Diagnostic plots in:  
     `shared_memory/4_CEX_out/colors/plots/`

---

## 🧠 Emotion Mappings:

Examples:
- `yellow` → Happiness
- `blue` → Sadness / Surprise
- `black` → Fear / Anger

---

## 🧩 Dependencies:
- `scikit-learn`
- `opencv-python`
- `matplotlib`
- `numpy`
