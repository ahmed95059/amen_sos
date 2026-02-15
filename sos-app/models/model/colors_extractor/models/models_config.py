"""
Project: SoulSketch
File: colors_extractor/models/color_config.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Configuration file for color extraction and emotion-color associations.
Defines allowed emotions, color mappings, object types, and schema constraints.
"""

import sys
from pathlib import Path

# ==== Project Root Resolution ====
# Go up from: colors_extractor/models/models_config.py -> colors_extractor/models -> colors_extractor -> model (project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Color Extraction Settings ====
NUM_DOMINANT_COLORS = 5
COLOR_DISTANCE_METRIC = "euclidean"

# ==== Emotion Definitions ====
EMOTIONS = [
    "Happiness", "Sadness", "Fear",
    "Anger", "Calm", "Surprise"
]

# ==== Allowed Colors ====
ALLOWED_COLORS = [
    "gray", "black", "blue", "red", "green",
    "yellow", "orange", "pink", "purple", "brown"
]

# ==== Object Types ====
OBJECT_TYPES = {
    "person": {},
    "tree": {},
    "house": {}
}

# ==== Schema Enums ====
ALLOWED_SIZES = ["small", "medium", "large"]

ALLOWED_POSITIONS = [
    "top-left", "top-center", "top-right",
    "bottom-left", "bottom-center", "bottom-right"
]

ALLOWED_EXPRESSIONS = [
    "angry_face", "happy_face", "sad-face", "neutral_face",
    "drawn-face", "hollow_eyes", "large_eyes", "angry_eyes",
    "dot_eyes", "far_eyes", "one_pupil"
]

# ==== Expression to Emotion Mapping ====
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

# ==== Emotion to Expression Reverse Map ====
EMOTION_TO_EXPRESSIONS = {}
for expr, emotions in EXPRESSION_EMOTION_MAP.items():
    for emotion in emotions:
        EMOTION_TO_EXPRESSIONS.setdefault(emotion, []).append(expr)

# ==== Emotion to Scene Color Preferences ====
EMOTION_COLOR_MAP = {
    "Happiness": ["yellow", "pink", "orange"],
    "Sadness":   ["blue", "gray", "black"],
    "Fear":      ["black", "gray", "purple"],
    "Anger":     ["red", "black", "orange"],
    "Calm":      ["green", "blue", "brown"],
    "Surprise":  ["yellow", "purple", "blue"]
}

# ==== Object Color Expectations ====
OBJECT_COLOR_MAP = {
    "person": {
        "normal":  ["pink", "brown", "blue", "green", "yellow", "red"],
        "unusual": ["purple", "orange", "gray", "black"]
    },
    "tree": {
        "normal":  ["green", "brown", "black"],
        "unusual": ["pink", "red", "purple", "blue"]
    },
    "house": {
        "normal":  ["brown", "gray", "blue", "red", "yellow"],
        "unusual": ["black", "purple", "green", "orange"]
    }
}
