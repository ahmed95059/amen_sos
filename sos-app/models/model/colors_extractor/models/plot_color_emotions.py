"""
Project: SoulSketch
File: colors_extractor/models/plot_color_emotions.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Plotting utilities for visualizing emotional color analysis.
Generates dual-plots per entity (drawing/object/expression):
- RGB → Mapped Color → Emotion Mapping Chart
- Pie Chart for Color Proportion
"""

import sys
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from typing import List, Dict
import numpy as np

# ==== Project Root Resolution ====
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name != "model":
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ==== Predefined Colors ====
COLOR_RGB_REFERENCE = {
    "red": (255, 0, 0), "blue": (0, 0, 255), "green": (0, 128, 0),
    "yellow": (255, 255, 0), "orange": (255, 165, 0), "pink": (255, 105, 180),
    "purple": (128, 0, 128), "gray": (128, 128, 128), "black": (0, 0, 0), "brown": (139, 69, 19)
}

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

# ==== Color Matching Helper ====
def match_color_by_range(rgb: tuple) -> str:
    for color, ranges in COLOR_RANGES.items():
        r, g, b = rgb
        if (ranges["r"][0] <= r <= ranges["r"][1] and
            ranges["g"][0] <= g <= ranges["g"][1] and
            ranges["b"][0] <= b <= ranges["b"][1]):
            return color
    return "unknown"

# ==== Function: draw_color_map ====
def draw_color_map(colors: List[Dict], title: str, highlight_unusual: bool = False):
    fig_height = max(4, 0.8 * len(colors))
    fig, ax = plt.subplots(figsize=(6, fig_height))
    ax.set_xlim(0, 3)
    ax.set_ylim(0, len(colors))
    ax.axis('off')

    for i, color_data in enumerate(colors):
        rgb = tuple(color_data["rgb"])
        mapped_name = match_color_by_range(rgb)
        emotion = color_data["emotion"]
        is_unusual = color_data.get("is_unusual", False)

        color_actual = tuple(v / 255 for v in rgb)
        color_mapped = tuple(v / 255 for v in COLOR_RGB_REFERENCE.get(mapped_name, (255, 255, 255)))

        y = len(colors) - i - 0.5
        ax.add_patch(plt.Circle((0.4, y), 0.3, color=color_actual,
                                ec='red' if highlight_unusual and is_unusual else 'black'))
        ax.annotate("", xy=(1.0, y), xytext=(0.7, y), arrowprops=dict(arrowstyle="->", color="black"))
        ax.add_patch(plt.Circle((1.3, y), 0.3, color=color_mapped))
        label = f"{emotion} ({mapped_name})"
        if highlight_unusual and is_unusual:
            label += " *Unusual*"
        ax.text(1.8, y, label, fontsize=12, verticalalignment='center')

    plt.title(title, fontsize=18)
    plt.tight_layout()
    return fig

# ==== Function: draw_color_proportion_pie ====
def draw_color_proportion_pie(colors: List[Dict], title: str):
    if not colors:
        return plt.figure()

    labels = [f"{match_color_by_range(tuple(c['rgb']))} ({c['emotion']})" for c in colors]
    colors_rgb = [tuple(v / 255 for v in c["rgb"]) for c in colors]
    proportions = [c.get("proportion", 1) for c in colors]

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.pie(proportions, labels=labels, startangle=90, autopct="%1.1f%%",
           colors=colors_rgb, textprops={'fontsize': 10})
    ax.set_title(title, fontsize=14)
    plt.close(fig)
    return fig

# ==== Function: combine_mapping_and_pie ====
def combine_mapping_and_pie(rgb_mapping_fig, pie_fig, title: str):
    fig, axs = plt.subplots(1, 2, figsize=(14, 6))
    fig.suptitle(title, fontsize=20)

    for ax, src_fig in zip(axs, [rgb_mapping_fig, pie_fig]):
        canvas = FigureCanvas(src_fig)
        canvas.draw()
        img = np.frombuffer(canvas.buffer_rgba(), dtype=np.uint8)
        img = img.reshape(src_fig.canvas.get_width_height()[::-1] + (4,))
        ax.imshow(img)
        ax.axis('off')

    plt.tight_layout(pad=1.0)
    plt.close(rgb_mapping_fig)
    plt.close(pie_fig)
    return fig
