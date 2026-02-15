# 📁 Module: JSON Builder

### 🎯 Purpose:
This module aggregates, restructures, and validates analysis data across all processing stages of SoulSketch.  
It produces the **pre-analysis** and **post-analysis** JSONs, which serve as the core structured outputs used for final report generation and backend transmission.

---

## 📦 Contents:

| File | Purpose |
|------|---------|
| `build_pre_analysis_format.py` | Combines object, expression, color, and emotion data into a validated pre_analysis.json file. |
| `build_post_analysis_format.py` | Merges the pre_analysis data with the final emotional text into post_analysis.json. |
| `get_data_from_shared.py` | Gathers and validates all intermediate results from `shared_memory` into unified Python dicts. |
| `color_emotion_mapping.py` | Contains mappings from expression → emotion and reverse, used during pre-analysis creation. |
| `validate_input_using_scheme.py` | Validates JSON files against schemas using `jsonschema` and optional colorama output. |
| `run_JB_A.py` | Runs Part A: gathers data and builds the pre-analysis structure. |
| `run_JB_B.py` | Runs Part B: builds the final post-analysis structure (with generated text). |

---

## 🔁 Flow Summary:

1. **Input Files (from shared_memory)**:
   - Emotion Classification JSON (EC)
   - Object detection metadata
   - Facial expressions detection results
   - Color extraction results (drawing, objects, expressions)
   - Final textual analysis (for post)

2. **Processing**:
   - Validates all inputs using JSON schemas.
   - Builds structured list/dict entries for objects and expressions.
   - Enriches data with emotion mapping and color interpretation.
   - Combines everything into consistent schema-backed outputs.

3. **Output**:
   - `shared_memory/5_JSON_out/pre_analysis.json`
   - `shared_memory/5_JSON_out/post_analysis.json`

---

## 🧩 Dependencies:
- `jsonschema`
- `colorama` (optional, for terminal output coloring)
- `uuid` (for auto-generating expression IDs)
