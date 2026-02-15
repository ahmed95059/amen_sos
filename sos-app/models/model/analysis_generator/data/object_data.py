"""
Project: SoulSketch
File: analysis_generator/data/object_data.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Represents an object (e.g., tree, person, house) with visual-emotional metadata extracted
from pre_analysis.json. Generates symbolic, spatial, and color-based interpretations
using emotion mappings and natural language templates.
"""

import sys
from pathlib import Path
import random
import re
from typing import List, Dict, Optional, Set

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Helpers ====
_CAMEL_RE = re.compile(r"([a-z0-9])([A-Z])")


def norm_key(s: str) -> str:
    if not s:
        return ""
    s = _CAMEL_RE.sub(r"\1_\2", s)
    s = s.replace("-", "_").replace(" ", "_")
    return re.sub(r"__+", "_", s).lower()


def choose_phrase(mapping: Dict[str, Dict], key: str) -> str:
    key = norm_key(key)
    entry = mapping.get(key) or mapping.get(key.replace("_", "-"))
    return random.choice(entry["phrases"]) if entry and "phrases" in entry else key


def choose_template(templates: List[Dict[str, str]], used: Set[str]) -> str:
    if not templates:
        return "{phrase}"
    available = [t for t in templates if t["template"] not in used]
    sel = random.choice(available) if available else random.choice(templates)
    used.add(sel["template"])
    return sel["template"]


def _get_mapping(d: Dict, key: str):
    k = norm_key(key)
    return d.get(k) or d.get(k.replace("_", "-")) or d.get(key)


def extract_dominant_color(data: Dict) -> str:
    """
    Extracts the color name most associated with the object's dominant emotion.

    Args:
        data (dict): Object entry from pre_analysis.json.

    Returns:
        str: Color name or empty string if not found.
    """
    emotion_label = data.get("dominant_emotion_color", "")
    for color in data.get("colors", []):
        if color.get("emotion", "").lower() == emotion_label.lower():
            return color.get("color_name", "")
    return ""


# ==== ObjectData Class ====
class ObjectData:
    """
    Represents a single object extracted from the drawing, with emotion-related metadata.
    Generates symbolic, color-based, spatial and expression-based descriptions.
    """

    def __init__(self, data: Dict):
        self.id: str = data.get("id", "")
        self.type: str = data.get("type", "")
        self.position: str = data.get("position", "")
        self.size: str = data.get("size", "")
        self.dominant_expression: Optional[str] = data.get("dominant_expression")
        self.color_class: str = "unusual" if data.get("is_color_unusual", False) else "normal"
        self.colors: List[Dict] = data.get("colors", [])
        self.dominant_emotion_color: str = extract_dominant_color(data)

    def describe(self, templates: Dict, mappings: Dict) -> List[str]:
        """
        Generates textual descriptions for the object based on mappings and templates.

        Args:
            templates (Dict): Loaded text_templates.json content.
            mappings (Dict): Loaded emotion_mappings.json content.

        Returns:
            List[str]: List of descriptive lines about this object.
        """
        lines, used = [], set()
        type_key = self.type

        obj_mapping = mappings.get("object_mappings", {}).get(type_key, {})
        obj_templates = templates.get(type_key, {})

        if not obj_mapping or not obj_templates:
            print(f"[WARN] No mapping/template for object type '{self.type}'")
            return lines

        # Symbolism
        if (sym_map := obj_mapping.get("symbolism")) and (sym_tpl := obj_templates.get("symbolism")):
            phr = random.choice(sym_map["phrases"])
            tmp = choose_template(sym_tpl, used)
            lines.append(tmp.format(phrase=f"**{phr}**", tone_variant=f"**{phr}**", object=f"**{self.type}**"))

        # Color
        if (col_tmpls := obj_templates.get("color", {}).get(self.color_class, [])) and self.dominant_emotion_color:
            phr = choose_phrase(mappings["global_color_emotions"], self.dominant_emotion_color)
            tone = choose_phrase(mappings["global_color_emotions"], self.dominant_emotion_color)
            tmp = choose_template(col_tmpls, used)
            lines.append(tmp.format(
                color=f"**{self.dominant_emotion_color}**",
                phrase=f"**{phr}**",
                tone_variant=f"**{tone}**"
            ))

        # Size
        if self.size:
            size_map = _get_mapping(obj_mapping.get("size_meaning", {}), self.size)
            size_tpl = _get_mapping(obj_templates.get("size", {}), self.size)
            if size_map and size_tpl:
                phr = random.choice(size_map["phrases"])
                tmp = choose_template(size_tpl, used)
                lines.append(tmp.format(phrase=f"**{phr}**", tone_variant=f"**{phr}**"))

        # Position
        if self.position:
            pos_key = norm_key(self.position)
            pos_map = _get_mapping(obj_mapping.get("position", {}), pos_key)
            pos_tpl = _get_mapping(obj_templates.get("position", {}), pos_key)
            if pos_map and pos_tpl:
                phr = random.choice(pos_map["phrases"])
                tone = random.choice(pos_map["tone_variants"])
                tmp = choose_template(pos_tpl, used)
                lines.append(tmp.format(phrase=f"**{phr}**", tone_variant=f"**{tone}**"))

        # Expression (optional)
        if self.dominant_expression:
            expr_key = norm_key(self.dominant_expression)
            expr_map = _get_mapping(obj_mapping.get("facial_expressions", {}), expr_key)
            expr_tpl = _get_mapping(obj_templates.get("expression", {}), expr_key)
            if expr_map and expr_tpl:
                phr = random.choice(expr_map["phrases"])
                tone = random.choice(expr_map["tone_variants"])
                tmp = choose_template(expr_tpl, used)
                lines.append(tmp.format(phrase=f"**{phr}**", tone_variant=f"**{tone}**"))

        return lines
