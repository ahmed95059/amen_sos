# 🧠 Module: Analysis Text Generator (AG)

### 🎯 Purpose
This module transforms structured emotion-related data from `pre_analysis.json` into natural language descriptions.
The output includes both Markdown-style sections and a flattened paragraph of emotional interpretation,
which is saved into `shared_memory/6_AG_out/analysis_text.json`.

---

## 📂 Files Overview

| File | Description |
|------|-------------|
| `analysis_generator.py` | Core logic to convert structured scene/object/expression data into descriptive text. |
| `run_AG.py` | Entrypoint script to run the analysis stage. |
| `analysis_input.py` | Parses `pre_analysis.json` into structured Python classes (SceneData, ObjectData, ExpressionData). |
| `scene_data.py` | Handles emotion description for the full scene using color and tone-based templates. |
| `object_data.py` | Describes each symbolic object (tree, house, person, etc.) based on size, position, color, and expression. |
| `expression_data.py` | Describes each facial expression as a narrative using tone and phrasing mappings. |
| `save_to_shared.py` | Utility to write output to `shared_memory/6_AG_out/analysis_text.json`. |

---

## 🧩 How It Works

1. **Input:**  
   Loads data from `5_JSON_out/pre_analysis.json`, which includes:
   - General emotion and confidence
   - Object list (with size, position, dominant color/emotion)
   - Facial expression list

2. **Mapping Resources:**  
   Uses:
   - `text_templates.json`: customizable phrase templates
   - `emotion_mappings.json`: symbolic tone and meaning mapping for colors, positions, etc.

3. **Outputs:**
   - `scene_descriptions`: list of lines about the scene's emotion and colors
   - `object_descriptions`: dictionary of lines per object
   - `expression_descriptions`: dictionary of lines per facial expression
   - `full_paragraph`: compact summary paragraph for backend use

---

## 📤 Output Path

- `shared_memory/6_AG_out/analysis_text.json`

This file is the final textual result before report generation.

---

## ✅ Dependencies

- No external packages (uses only standard Python libraries)

