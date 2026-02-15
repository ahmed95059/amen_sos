"""
Project: SoulSketch
File: object_detection/model/model_config.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Configuration file for the object detection model based on YOLOv8.
Defines model paths, class names, and inference thresholds.
"""

import sys
from pathlib import Path
import os
import yaml

# ==== Project Root Resolution ====
# Ensures the root path is added to sys.path for absolute imports
# Go up from: object_detection/model/model_config.py -> object_detection/model -> object_detection -> model (project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Model and Data Paths ====
# Absolute path to the trained YOLOv8 model
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "Yolo11s_HHT_trained.pt"))

# Absolute path to the YAML file used during model training
DATA_YAML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "data.yaml"))

# ==== Class Names Loading ====
# Extracts class labels from the YAML configuration
with open(DATA_YAML_PATH, 'r') as f:
    data = yaml.safe_load(f)
    CLASS_NAMES = data.get("names", [])

# ==== Inference Settings ====
# Thresholds for detection filtering
CONFIDENCE_THRESHOLD = 0.25  # Minimum confidence to keep a detection
IOU_THRESHOLD = 0.45          # IOU threshold for Non-Maximum Suppression
