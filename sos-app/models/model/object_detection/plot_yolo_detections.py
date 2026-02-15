"""
Project: SoulSketch
File: object_detection/plot_yolo_detections.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Visualization utilities for YOLO-based object detection results.
Includes:
- Annotated image with bounding boxes
- Class frequency bar chart
- Confidence distribution histogram
"""

import sys
from pathlib import Path
import cv2
import matplotlib.pyplot as plt
import numpy as np
from collections import Counter
from typing import List, Dict

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Class Color Map ====
CLASS_COLORS = {
    "person": (255, 0, 0),       # Red
    "tree": (160, 82, 45),       # Brown
    "house": (0, 0, 255),        # Blue
    "default": (0, 0, 0)         # Black (fallback)
}

# ==== Function: draw_bounding_boxes ====
def draw_bounding_boxes(image: np.ndarray, detections: List[Dict], save_path: Path, threshold: float = 0.4):
    """
    Draws bounding boxes and class labels on a copy of the input image.

    Args:
        image (np.ndarray): Original BGR image.
        detections (List[Dict]): List of detection dicts with 'bbox', 'label', 'confidence'.
        save_path (Path): Path to save the annotated image.
        threshold (float): Minimum confidence to draw label name (else 'Unknown').

    Returns:
        None
    """
    annotated = image.copy()

    for det in detections:
        x1 = int(det["bbox"]["x1"])
        y1 = int(det["bbox"]["y1"])
        x2 = int(det["bbox"]["x2"])
        y2 = int(det["bbox"]["y2"])
        label = det.get("label", "unknown")
        conf = det.get("confidence", 0.0)

        display_label = label if conf >= threshold else "Unknown"
        color = CLASS_COLORS.get(label, CLASS_COLORS["default"])

        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        text = f"{display_label} ({conf:.2f})"
        cv2.putText(annotated, text, (x1, max(y1 - 10, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    save_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(save_path), annotated)

# ==== Function: plot_class_distribution ====
def plot_class_distribution(detections: List[Dict], save_path: Path):
    """
    Creates a bar chart showing the number of detections per class.

    Args:
        detections (List[Dict]): List of detection dicts with 'label'.
        save_path (Path): Output path for the chart.

    Returns:
        None
    """
    class_counts = Counter([det["label"] for det in detections])
    labels, counts = zip(*class_counts.items()) if class_counts else ([], [])

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(labels, counts, color='skyblue', edgecolor='black')
    ax.set_title("Object Count per Class")
    ax.set_xlabel("Class")
    ax.set_ylabel("Count")
    plt.xticks(rotation=45)
    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close(fig)

# ==== Function: plot_confidence_distribution ====
def plot_confidence_distribution(detections: List[Dict], save_path: Path):
    """
    Creates a histogram of confidence scores from detected objects.

    Args:
        detections (List[Dict]): List of detection dicts with 'confidence'.
        save_path (Path): Path to save the plot.

    Returns:
        None
    """
    confidences = [det["confidence"] for det in detections if "confidence" in det]
    if not confidences:
        return

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(confidences, bins=10, color='orange', edgecolor='black', alpha=0.8)
    ax.set_title("Confidence Distribution")
    ax.set_xlabel("Confidence")
    ax.set_ylabel("Frequency")
    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close(fig)
