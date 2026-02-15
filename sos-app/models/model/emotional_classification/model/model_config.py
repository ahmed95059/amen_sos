"""
Project: SoulSketch
File: emotional_classification/model/model_config.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Provides configuration settings and constants for the emotional classification model.
Includes model path and emotion label definitions.
"""

import sys
from pathlib import Path
import os

# ==== Project Root Resolution ====
# Dynamically resolve the root path of the project to ensure correct imports
# Go up from: emotional_classification/model/model_config.py -> emotional_classification/model -> emotional_classification -> model (project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Model Configuration ====
# Define the path to the trained emotional classification model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), "ResNet18_trained.pt")

# ==== Emotion Labels ====
# Ordered list of emotion labels corresponding to the model's output indices
EMOTION_LABELS = [
    "Anger",
    "Calm",
    "Fear",
    "Happiness",
    "Sadness",
    "Surprise"
]
