"""
Project: SoulSketch
File: facial_expressions_detection/plot_yolo_exp_detections.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Plot utilities for facial expression detection results.
Includes:
- Annotated image with bounding boxes and labels
- Expression type distribution chart
- Confidence score histogram
"""

import sys
from pathlib import Path
import cv2
import matplotlib.pyplot as plt
from matplotlib import patches
from collections import Counter
from typing import List, Dict


PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Expression Color Map ====
EXPRESSION_COLORS = {
    "happy": "green",
    "sad": "blue",
    "angry": "red",
    "surprised": "orange",
    "neutral": "gray",
    "fearful": "purple",
    "disgusted": "brown"
}

# ==== Function: draw_annotated_image ====
def draw_annotated_image(image_path: Path, detections: List[Dict], save_path: Path):
    """
    Draws bounding boxes with expression labels over an image and saves the output.

    Args:
        image_path (Path): Path to the input image.
        detections (List[Dict]): List of detections with 'label', 'bbox', and 'confidence'.
        save_path (Path): Path to save the annotated image.

    Returns:
        None
    """
    image = cv2.imread(str(image_path))
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(image_rgb)
    for det in detections:
        x1, y1, x2, y2 = det['bbox']
        label = det['label']
        conf = det['confidence']
        color = EXPRESSION_COLORS.get(label.lower(), 'black')
        rect = patches.Rectangle((x1, y1), x2 - x1, y2 - y1,
                                 linewidth=2, edgecolor=color, facecolor='none')
        ax.add_patch(rect)
        ax.text(x1, y1 - 5, f"{label} ({conf:.2f})",
                color=color, fontsize=10, backgroundcolor='white')

    ax.axis('off')
    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()

# ==== Function: plot_expression_distribution ====
def plot_expression_distribution(detections: List[Dict], save_path: Path):
    """
    Plots a bar chart showing the number of detected expressions per type.

    Args:
        detections (List[Dict]): List of detections with 'label'.
        save_path (Path): Path to save the bar chart.

    Returns:
        None
    """
    labels = [d['label'] for d in detections]
    counts = Counter(labels)
    expressions = list(counts.keys())
    values = list(counts.values())
    colors = [EXPRESSION_COLORS.get(lbl.lower(), 'gray') for lbl in expressions]

    plt.figure(figsize=(8, 5))
    plt.bar(expressions, values, color=colors)
    plt.title("Expression Type Distribution")
    plt.xlabel("Expression")
    plt.ylabel("Count")
    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()

# ==== Function: plot_expression_confidence ====
def plot_expression_confidence(detections: List[Dict], save_path: Path):
    """
    Plots a histogram of confidence values for detected expressions.

    Args:
        detections (List[Dict]): List of detections with 'confidence'.
        save_path (Path): Path to save the histogram.

    Returns:
        None
    """
    confidences = [d['confidence'] for d in detections]
    plt.figure(figsize=(8, 5))
    plt.hist(confidences, bins=10, color='skyblue', edgecolor='black')
    plt.title("Detection Confidence Distribution")
    plt.xlabel("Confidence")
    plt.ylabel("Frequency")
    plt.tight_layout()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()

# ==== Function: generate_expression_plots ====
def generate_expression_plots(image_path: Path, detections: List[Dict], output_dir: Path):
    """
    Generates all visualizations for facial expression analysis.

    Args:
        image_path (Path): Path to the input image.
        detections (List[Dict]): List of expression detections.
        output_dir (Path): Directory where plots will be saved.

    Returns:
        None
    """
    draw_annotated_image(image_path, detections, output_dir / "annotated_expressions.png")
    plot_expression_distribution(detections, output_dir / "expression_distribution.png")
    plot_expression_confidence(detections, output_dir / "expression_confidence.png")
