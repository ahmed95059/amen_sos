"""
Project: SoulSketch
File: json_builder/maps/emotion_expression_mapping.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Defines mappings between facial expressions and emotions.
Includes:
- Expression → Emotion: base mapping for individual expression types.
- Emotion → Expression: reverse map auto-generated for quick lookup.
"""

import sys
from pathlib import Path

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ==== Expression → Emotion Mapping ====
EXPRESSION_EMOTION_MAP = {
    "angry_face":     ["Anger"],
    "angry_eyes":     ["Anger"],
    "dot_eyes":       ["Calm", "Surprise"],
    "drawn-face":     ["Sadness", "Fear"],
    "far_eyes":       ["Sadness", "Calm"],
    "happy_face":     ["Happiness", "Surprise"],
    "large_eyes":     ["Fear", "Surprise"],
    "neutral_face":   ["Calm", "Sadness"],
    "one_pupil":      ["Fear", "Surprise"],
    "sad-face":       ["Sadness"]
}

# ==== Auto-generated Reverse Mapping: Emotion → Expressions ====
EMOTION_TO_EXPRESSIONS = {}
for expr, emotions in EXPRESSION_EMOTION_MAP.items():
    for emotion in emotions:
        EMOTION_TO_EXPRESSIONS.setdefault(emotion, []).append(expr)