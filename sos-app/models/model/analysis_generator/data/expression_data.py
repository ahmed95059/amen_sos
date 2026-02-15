"""
Project: SoulSketch
File: analysis_generator/data/expression_data.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Contains the ExpressionData class and supporting utilities for generating
textual descriptions of facial expressions based on emotion mappings and templates.
Used to generate the narrative for each character's expression in the drawing.
"""

import sys
from pathlib import Path
import random
import re
from typing import Dict, List, Optional, Set

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
    """
    Normalize keys to lowercase with underscores (snake_case).
    """
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


# ==== ExpressionData Class ====
class ExpressionData:
    """
    Represents a single facial expression detection result from pre_analysis.json.
    Used for generating textual descriptions of characters' emotional expressions.
    """

    def __init__(self, data: Dict):
        self.id: str = data.get("id", "")
        self.expression_label: str = data.get("expression", "")
        self.mapped_emotion: str = data.get("mapped_emotion", "")
        self.confidence: float = data.get("confidence", 0.0)
        self.crop_path: str = data.get("crop_path", "")
        self.colors: List[Dict] = data.get("colors", [])
        self.dominant_emotion_color: Optional[str] = data.get("dominant_emotion_color")

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "expression_label": self.expression_label,
            "mapped_emotion": self.mapped_emotion,
            "confidence": self.confidence,
            "crop_path": self.crop_path,
            "colors": self.colors,
            "dominant_emotion_color": self.dominant_emotion_color,
        }

    def describe(self, templates: Dict, mappings: Dict) -> List[str]:
        """
        Generate textual description for a character's facial expression.

        Args:
            templates (Dict): Loaded text_templates.json (expression templates from "person").
            mappings (Dict): Loaded emotion_mappings.json (facial expression mappings from "person").

        Returns:
            List[str]: List of description lines for this facial expression.
        """
        lines, used = [], set()
        expr_key = norm_key(self.expression_label)

        expr_map = _get_mapping(mappings.get("object_mappings", {}).get("person", {}).get("facial_expressions", {}), expr_key)
        expr_tpl = _get_mapping(templates.get("person", {}).get("expression", {}), expr_key)

        if expr_map and expr_tpl:
            phr  = random.choice(expr_map["phrases"])
            tone = random.choice(expr_map["tone_variants"])
            tmp  = choose_template(expr_tpl, used)
            lines.append(tmp.format(phrase=f"**{phr}**", tone_variant=f"**{tone}**"))
        else:
            lines.append("From the presented face it was not possible to infer a specific emotion.")

        return lines
