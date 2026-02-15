"""
Project: SoulSketch
File: emotional_classification/plot_emotion_classification.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Utility for generating a visual bar plot that represents the output probabilities
from the emotional classification model. Highlights the predicted emotion.
"""

import sys
from pathlib import Path
import matplotlib.pyplot as plt
from typing import List

# ==== Project Root Resolution ====
# Ensures the root path is added to sys.path for absolute imports
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Function: plot_emotion_bar ====
def plot_emotion_bar(emotion_probs: List[float], labels: List[str], predicted_index: int, save_path: Path):
    """
    Generates a bar plot to visualize emotion probabilities.

    Args:
        emotion_probs (List[float]): Probabilities corresponding to each emotion label.
        labels (List[str]): Names of emotion classes.
        predicted_index (int): Index of the emotion with the highest probability.
        save_path (Path): Destination path to save the plot image.

    Returns:
        None
    """
    # Create figure and plot bar graph with gray bars
    plt.figure(figsize=(10, 6))
    bars = plt.bar(range(len(emotion_probs)), emotion_probs, color='lightgray', edgecolor='black')

    # Highlight the predicted emotion in orange
    bars[predicted_index].set_color('orange')

    # Set axis labels and styling
    plt.xticks(range(len(labels)), labels, rotation=45, ha='right')
    plt.ylim(0, 1.0)
    plt.ylabel("Probability")
    plt.title("Emotion Classification Output", fontsize=16)
    plt.tight_layout()

    # Save plot to specified path
    save_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()

    # Optional print for confirmation
    print(f"[PLOT] Emotion classification plot saved to {save_path}")
