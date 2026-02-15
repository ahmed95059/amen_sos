"""
Project: SoulSketch
File: analysis_generator/analysis_input.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Wraps the contents of pre_analysis.json into structured Python objects for analysis.
Objects include:
- SceneData (overall scene-level emotion and color info)
- ObjectData (symbolic/color/size/position interpretation of elements)
- ExpressionData (facial expression → emotional description)
"""

import sys
from pathlib import Path
import json
from typing import List, Union

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Imports ====
from data.scene_data import SceneData
from data.object_data import ObjectData
from data.expression_data import ExpressionData


# ==== AnalysisInput Class ====
class AnalysisInput:
    """
    Loads and structures analysis input from pre_analysis.json into data objects.

    Attributes:
        scene (SceneData): General emotional summary of the drawing.
        objects (List[ObjectData]): List of symbolic objects with color/position info.
        expressions (List[ExpressionData]): List of detected facial expressions.
    """

    def __init__(self, path: Union[str, Path]):
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Pre-analysis file not found: {path}")

        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        self.scene: SceneData = SceneData(raw)
        self.objects: List[ObjectData] = [ObjectData(obj) for obj in raw.get("objects", [])]
        self.expressions: List[ExpressionData] = [
            ExpressionData(expr) for expr in raw.get("facial_expressions", [])
        ]
