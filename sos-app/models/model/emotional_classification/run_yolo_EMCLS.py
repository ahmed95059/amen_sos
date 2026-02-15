"""
Project: SoulSketch
File: emotional_classification/run_yolo_EMCLS.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Loads a YOLO-based emotion classification model, applies it to a predefined input image,
generates a probability plot for the predicted emotion, and saves the result and visualization
to the shared memory directory for further use.
"""

import sys
from pathlib import Path
import os
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from ultralytics import YOLO
from PIL import Image
import numpy as np
import cv2
import matplotlib.pyplot as plt
from emotional_classification.model import model_config
from emotional_classification.save_to_shared import save_emotion_result

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Configuration and Paths ====
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "model", "Yolo_Classifier.pt")
INPUT_IMAGE_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "..", "shared_memory", "0_BE_input", "original_input.png"))
PLOT_OUTPUT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "shared_memory", "1_EC_out", "plots"))
PLOT_OUTPUT_PATH = os.path.join(PLOT_OUTPUT_DIR, "emotion_probs_plot.png")
EMOTION_LABELS = model_config.EMOTION_LABELS

# ==== Function: boost_colors ====
def boost_colors(pil_img, alpha=1.3, beta=15):
    """
    Enhances contrast and brightness of an image to improve model performance.

    Args:
        pil_img (PIL.Image): Input image.
        alpha (float): Contrast control factor.
        beta (int): Brightness control factor.

    Returns:
        PIL.Image: Enhanced image.
    """
    img = np.array(pil_img.convert("RGB"))
    img = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
    return Image.fromarray(img)

# ==== Function: classify_with_yolo ====
def classify_with_yolo(model, image_path: str):
    """
    Applies YOLO classifier on the input image and returns probabilities and top prediction.

    Args:
        model (YOLO): Preloaded YOLO model.
        image_path (str): Path to the input image.

    Returns:
        Tuple[List[float], dict]: List of class probabilities and prediction result with label and confidence.
    """
    image = Image.open(image_path).convert("RGB")
    boosted = boost_colors(image)
    results = model(boosted, verbose=False)
    probs = results[0].probs
    top_idx = int(probs.top1)
    confidence = float(probs.top1conf)
    return probs.data.cpu().numpy().tolist(), {
        "label": EMOTION_LABELS[top_idx],
        "confidence": confidence
    }

# ==== Function: plot_emotion_distribution ====
def plot_emotion_distribution(probabilities, labels, save_path):
    """
    Plots a bar chart representing the model's output probabilities for each emotion.

    Args:
        probabilities (List[float]): Probabilities per emotion.
        labels (List[str]): Corresponding emotion labels.
        save_path (str): Path to save the plot.

    Returns:
        None
    """
    plt.figure(figsize=(8, 4))
    plt.bar(labels, probabilities, color="skyblue")
    plt.title("Emotion Probabilities")
    plt.ylabel("Confidence")
    plt.xticks(rotation=45)
    plt.tight_layout()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.savefig(save_path, dpi=150)
    plt.close()

# ==== Main Execution Block ====
if __name__ == "__main__":
    try:
        print("[INFO] Loading YOLO model...")
        model = YOLO(MODEL_PATH)

        print("[INFO] Checking for input image...")
        if not os.path.isfile(INPUT_IMAGE_PATH):
            raise FileNotFoundError(f"Expected input image not found at: {INPUT_IMAGE_PATH}")

        print(f"[INFO] Input image found: {INPUT_IMAGE_PATH}")
        print("[INFO] Running classification...")
        probs, result = classify_with_yolo(model, INPUT_IMAGE_PATH)

        print("[INFO] Creating probability plot...")
        plot_emotion_distribution(probs, EMOTION_LABELS, PLOT_OUTPUT_PATH)

        print("[INFO] Saving results to shared memory...")
        save_emotion_result(result)

        print("[SUCCESS] Emotion classification process completed.")

    except Exception as e:
        print(f"[ERROR] Unexpected failure: {e}")
        import traceback
        traceback.print_exc()