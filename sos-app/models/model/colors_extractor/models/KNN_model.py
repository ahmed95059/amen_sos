"""
Project: SoulSketch
File: colors_extractor/models/KNN_model.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Extracts dominant colors from an image using KMeans clustering.
Maps them to predefined emotion-color associations.
Generates visual summaries for emotional interpretation.
"""

import sys
from pathlib import Path
import cv2
import numpy as np
from sklearn.cluster import KMeans
from typing import List, Dict, Tuple, Optional

from models.models_config import (
    NUM_DOMINANT_COLORS,
    COLOR_DISTANCE_METRIC,
    ALLOWED_COLORS,
    EMOTION_COLOR_MAP,
    OBJECT_COLOR_MAP
)
from models.plot_color_emotions import (
    draw_color_map,
    draw_color_proportion_pie,
    combine_mapping_and_pie
)

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Predefined RGB Ranges for Named Colors ====
COLOR_RANGES = {
    "red":    {"r": (200, 255), "g": (0, 80),   "b": (0, 80)},
    "blue":   {"r": (0, 80),    "g": (0, 80),   "b": (180, 255)},
    "green":  {"r": (0, 100),   "g": (100, 200),"b": (0, 100)},
    "yellow": {"r": (200, 255), "g": (200, 255),"b": (0, 80)},
    "orange": {"r": (200, 255), "g": (100, 200),"b": (0, 80)},
    "pink":   {"r": (180, 255), "g": (70, 200), "b": (140, 255)},
    "purple": {"r": (80, 180),  "g": (0, 80),   "b": (80, 180)},
    "gray":   {"r": (90, 180),  "g": (90, 180), "b": (90, 180)},
    "black":  {"r": (0, 50),    "g": (0, 50),   "b": (0, 50)},
    "brown":  {"r": (110, 190), "g": (50, 120), "b": (30, 100)}
}

# ==== Helper Function: match_color_by_range ====
def match_color_by_range(rgb: Tuple[int, int, int]) -> Optional[str]:
    """
    Matches an RGB tuple to a color name based on predefined ranges.

    Args:
        rgb (Tuple[int, int, int]): RGB color value.

    Returns:
        Optional[str]: Name of the matched color, or None if not matched.
    """
    for color, ranges in COLOR_RANGES.items():
        r, g, b = rgb
        if (ranges["r"][0] <= r <= ranges["r"][1] and
            ranges["g"][0] <= g <= ranges["g"][1] and
            ranges["b"][0] <= b <= ranges["b"][1]):
            return color
    return None

# ==== Main Function: extract_emotional_colors ====
def extract_emotional_colors(
    image: np.ndarray,
    output_dir: Path,
    entity_type: str,
    entity_id: Optional[str] = None,
    object_type: Optional[str] = None,
    use_range_based: bool = True
) -> List[Dict]:
    """
    Extracts dominant colors and maps them to emotion categories.
    Also saves a combined plot for interpretation.

    Args:
        image (np.ndarray): Input image in BGR format.
        output_dir (Path): Base output path.
        entity_type (str): One of ['drawing', 'object', 'expression'].
        entity_id (Optional[str]): Optional unique identifier.
        object_type (Optional[str]): Object category (for unusual color check).
        use_range_based (bool): Whether to use predefined color ranges.

    Returns:
        List[Dict]: List of detected color-emotion mappings.
    """
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pixels = img_rgb.reshape((-1, 3))
    pixels = pixels[np.mean(pixels, axis=1) < 240]  # Filter overly white
    pixels = pixels[np.std(pixels, axis=1) > 15]    # Filter flat areas

    if len(pixels) == 0:
        print("[WARN] All pixels were filtered out — no valid colors remain.")
        return []

    kmeans = KMeans(n_clusters=NUM_DOMINANT_COLORS, n_init=10)
    kmeans.fit(pixels)
    dominant_colors = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    counts = np.bincount(labels)

    results = []
    for color, count in zip(dominant_colors, counts):
        rgb_tuple = tuple(color.tolist())
        color_name = match_color_by_range(rgb_tuple) if use_range_based else None

        emotion = None
        for emo, colors in EMOTION_COLOR_MAP.items():
            if color_name in colors:
                emotion = emo
                break

        if emotion is None:
            continue

        color_data = {
            "color_name": color_name,
            "rgb": list(rgb_tuple),
            "emotion": emotion,
            "proportion": int(count)
        }

        if object_type in OBJECT_COLOR_MAP:
            color_data["is_unusual"] = color_name in OBJECT_COLOR_MAP[object_type].get("unusual", [])

        results.append(color_data)

    # ==== Save plots ====
    subfolder = output_dir / entity_type / (entity_id or "summary")
    subfolder.mkdir(parents=True, exist_ok=True)

    title = f"{entity_type.capitalize()} Analysis"
    if entity_id:
        title += f" - {entity_id}"

    fig_map = draw_color_map(results, title=title, highlight_unusual=(entity_type == "object"))
    fig_pie = draw_color_proportion_pie(results, title=f"{entity_type.capitalize()} Color Proportion")
    combined_fig = combine_mapping_and_pie(fig_map, fig_pie, title)

    save_path = subfolder / "plot.png"
    combined_fig.savefig(save_path, dpi=150)

    return results
