"""
Project: SoulSketch
File: analysis_generator/analysis_generator.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Main runner for the emotional analysis text generation.
Uses pre_analysis.json and converts its content into a structured emotional narrative.
Outputs:
- Markdown-style structure
- Flattened paragraph
- Full analysis saved to shared_memory/6_AG_out/analysis_text.json
"""

import sys
from pathlib import Path
import json
import random
from typing import List

# ==== Resolve Project Root ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Imports ====
from analysis_input import AnalysisInput
from data.scene_data import SceneData
from data.object_data import ObjectData
from data.expression_data import ExpressionData
from save_to_shared import save_analysis_output


# ==== Paths ====
SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE_PATH = SCRIPT_DIR / "mapping_and_templates" / "text_templates.json"
EMOTION_MAP_PATH = SCRIPT_DIR / "mapping_and_templates" / "emotion_mappings.json"
PRE_ANALYSIS_PATH = PROJECT_ROOT / "shared_memory" / "5_JSON_out" / "pre_analysis.json"


# ==== Utility Functions ====
def norm_key(s: str) -> str:
    import re
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s or "")
    return re.sub(r"[^a-z_]+", "_", s.lower()).strip("_")


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def choose_template(templates: List[dict], used: set) -> str:
    available = [t for t in templates if t["template"] not in used]
    sel = random.choice(available if available else templates)
    used.add(sel["template"])
    return sel["template"]


def choose_phrase(mapping: dict, category: str, key: str) -> str:
    key = norm_key(key)
    entry = mapping.get(category, {}).get(key) or mapping.get(category, {}).get(key.replace("_", "-"))
    phrases = entry.get("phrases", []) if entry else []
    return random.choice(phrases) if phrases else key


# ==== Description Builders ====
def generate_scene_description(scene: SceneData, templates, mapping) -> List[str]:
    lines, used = [], set()
    phr = choose_phrase(mapping, "scene_level_emotions", scene.emotion)
    tmpl = choose_template(templates["scene"]["emotion"], used)
    confidence = scene.emotion_confidence if scene.emotion_confidence is not None else 0.0
    lines.append(tmpl.format(phrase=f"**{phr}** ({confidence:.3f})",
                             tone_variant=f"**{phr}**", color=""))

    for color in scene.dominant_colors:
        cname = norm_key(color.get("color_name", ""))
        phr = choose_phrase(mapping, "global_color_emotions", cname)
        tone = phr
        tmpl = choose_template(templates["scene"]["color"], used)
        lines.append(tmpl.format(color=f"**{cname}**", phrase=f"**{phr}**", tone_variant=f"**{tone}**"))
    return lines


def generate_object_descriptions(objects: List[ObjectData], templates, mapping) -> dict:
    return {obj.id: obj.describe(templates, mapping) for obj in objects}


def generate_expression_descriptions(expressions: List[ExpressionData], templates, mapping) -> dict:
    results = {}
    for expr in expressions:
        desc = expr.describe(templates, mapping) or [
            "From the presented face it was not possible to infer a specific emotion."]
        results[expr.id] = desc
    return results


# ==== Markdown Assembly ====
def build_markdown(scene_lines, obj_dict, expr_dict) -> List[str]:
    md = [
        "# Emotional Analysis",
        f"**Main Emotion:** **{scene_lines[0].split('**')[1]}**",
        "## Scene", *scene_lines,
        "## Objects"
    ]
    for oid, lines in obj_dict.items():
        md.append(f"### {oid}")
        md.extend(lines or ["(no descriptive matches)"])
    md.append("## Facial Expressions")
    for eid, lines in expr_dict.items():
        md.append(f"### {eid}")
        md.extend(lines or ["(no descriptive matches)"])
    return md


def flatten_markdown(md_lines: List[str], max_len: int = 100) -> str:
    paragraph, current_line = "", ""
    for line in md_lines:
        if line.startswith("#") or not line.strip():
            continue
        cleaned = line.replace("**", "").strip()
        if len(current_line) + len(cleaned) + 1 > max_len:
            paragraph += current_line.strip() + "\n"
            current_line = cleaned + " "
        else:
            current_line += cleaned + " "
    if current_line.strip():
        paragraph += current_line.strip() + "\n"
    return paragraph.strip()


# ==== Main Execution ====
def generate_analysis() -> None:
    analysis = AnalysisInput(PRE_ANALYSIS_PATH)
    templates = load_json(TEMPLATE_PATH)
    mapping = load_json(EMOTION_MAP_PATH)

    scene_lines = generate_scene_description(analysis.scene, templates, mapping)
    object_desc = generate_object_descriptions(analysis.objects, templates, mapping)
    expression_desc = generate_expression_descriptions(analysis.expressions, templates, mapping)

    markdown = build_markdown(scene_lines, object_desc, expression_desc)
    paragraph = flatten_markdown(markdown)

    data = {
        "scene_descriptions": scene_lines,
        "object_descriptions": object_desc,
        "expression_descriptions": expression_desc,
        "full_paragraph": paragraph
    }

    out_path = save_analysis_output(data, filename="analysis_text.json")

    print("\n".join(markdown))
    print(f"[INFO] JSON summary saved to: {out_path}\n")


# ==== Entry Point ====
if __name__ == "__main__":
    generate_analysis()
