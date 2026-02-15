"""
Project: SoulSketch
File: analysis_generator/data/scene_data.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Represents general emotional analysis of the full drawing.
Generates textual descriptions based on the overall emotional classification
and dominant colors, using emotion mappings and sentence templates.
"""

import sys
from pathlib import Path
import random
import re
from typing import List, Dict, Set

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


def choose_template(templates: List[Dict[str, str]], used: Set[str], required_fields: Set[str]) -> str:
    """
    Selects a sentence template that contains the required placeholders.
    Falls back to any template if no perfect match is found.

    Args:
        templates (List): List of template dictionaries with "template" keys.
        used (Set): Set of template strings already used.
        required_fields (Set): Placeholders required to appear in the selected template.

    Returns:
        str: Chosen template string.
    """
    def matches(tmpl: Dict[str, str]) -> bool:
        return required_fields.issubset(set(re.findall(r"{(.*?)}", tmpl["template"])))

    filtered = [t for t in templates if matches(t) and t["template"] not in used]
    if not filtered:
        filtered = [t for t in templates if matches(t)] or templates
    selected = random.choice(filtered)
    used.add(selected["template"])
    return selected["template"]


# ==== SceneData Class ====
class SceneData:
    """
    Represents scene-level emotional data from pre_analysis.json,
    including general emotion and dominant colors.
    Used to generate narrative summaries about the entire drawing.
    """

    def __init__(self, data: Dict):
        self.emotion: str = data.get("general_emotion", "")
        self.emotion_confidence: float = data.get("general_emotion_confidence", 0.0)
        self.dominant_colors: List[Dict] = data.get("dominant_drawing_colors", [])
        self.image_path: str = data.get("drawing_image_path", "")
        self.bw_image_path: str = data.get("drawing_bw_image_path", "")

    def describe(self, templates: Dict, mappings: Dict) -> List[str]:
        """
        Generate scene-level descriptive lines.

        Args:
            templates (Dict): Loaded text_templates.json
            mappings (Dict): Loaded emotion_mappings.json

        Returns:
            List[str]: List of narrative lines
        """
        lines = []
        used_templates = set()

        # === General Emotion Description ===
        phrase = choose_phrase(mappings["scene_level_emotions"], self.emotion)
        required = {"phrase"}
        tmpl = choose_template(templates["scene"]["emotion"], used_templates, required)
        lines.append(tmpl.format(
            phrase=f"**{phrase}** ({self.emotion_confidence:.3f})",
            tone_variant=f"**{phrase}**",
            color="**overall**"
        ))

        # === Dominant Color Descriptions ===
        for color in self.dominant_colors:
            name = norm_key(color.get("color_name", ""))
            if not name:
                continue
            phr = choose_phrase(mappings["global_color_emotions"], name)
            tone = choose_phrase(mappings["global_color_emotions"], name)
            required = {"color", "phrase"}
            tmpl = choose_template(templates["scene"]["color"], used_templates, required)
            lines.append(tmpl.format(
                color=f"**{name}**",
                phrase=f"**{phr}**",
                tone_variant=f"**{tone}**"
            ))

        return lines
