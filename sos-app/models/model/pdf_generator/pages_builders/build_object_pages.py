"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_object_pages.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Builds the Objects Analysis section of the final PDF report.

Includes:
1. Intro page with title
2. Bounding box results page (2 vertical images)
3. Object class + confidence plots (2x2 grid)
4. Per-object analysis pages (1 per detected object)
"""

import sys
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pages_builders.single_object_page_builder import build_single_object_page


BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
PLOT_WIDTH = 230
PLOT_HEIGHT = 180
FALLBACK_IMG = str(PROJECT_ROOT / "assets" / "image_placeholder.png")


def safe_draw_image(c, path, x, y, width, height):
    """
    Attempts to draw an image from path. If path is invalid, draws a fallback image.
    For headers/footers, disables aspect ratio preservation to ensure full-width stretch.
    """
    final_path = path if path and Path(path).exists() else FALLBACK_IMG

    # Disable aspect ratio preservation for header/footer to ensure full width
    preserve = not any(key in str(final_path).lower() for key in ["banner", "footer"])

    try:
        c.drawImage(ImageReader(final_path), x, y, width=width, height=height, preserveAspectRatio=preserve, mask='auto')
    except Exception as e:
        print(f"[DRAW ERROR] Failed to draw image from {final_path}: {e}")


def build_object_pages(output_path: str,
                        header_img_path: str,
                        footer_img_path: str,
                        objects: list[dict],
                        bbox_img_paths: list[str],
                        class_conf_plot_paths: list[str],
                        class_dist_plot_paths: list[str]):
    """
    Generates the Objects Analysis section with intro + context pages + per-object pages.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Intro Page
    safe_draw_image(c, header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT)
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(colors.HexColor("#111111"))
    c.drawCentredString(width / 2, height / 2, "Objects Analysis")
    safe_draw_image(c, footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT)
    c.showPage()

    # Bounding Box Page (2 images stacked vertically)
    safe_draw_image(c, header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT)
    content_height = height - BANNER_HEIGHT - FOOTER_HEIGHT
    half_height = content_height / 2

    for i, path in enumerate(bbox_img_paths[:2]):
        y = FOOTER_HEIGHT + (1 - i) * half_height
        safe_draw_image(c, path, 0, y, width=width, height=half_height)

    safe_draw_image(c, footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT)
    c.showPage()

    # Class + Confidence Distribution Page (4 plots in 2x2 grid)
    safe_draw_image(c, header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.HexColor("#111111"))
    title_y = height - BANNER_HEIGHT - 30
    c.drawCentredString(width / 2, title_y, "Object class distribution and confidence")

    available_height = height - BANNER_HEIGHT - FOOTER_HEIGHT - 60
    top_y = FOOTER_HEIGHT + available_height / 2
    mid_x = width / 2

    coords = [
        (0, top_y),
        (mid_x, top_y),
        (0, FOOTER_HEIGHT),
        (mid_x, FOOTER_HEIGHT)
    ]
    plots = class_conf_plot_paths + class_dist_plot_paths
    for path, (x, y) in zip(plots, coords):
        safe_draw_image(c, path, x, y, width=width / 2, height=available_height / 2)

    safe_draw_image(c, footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT)
    c.showPage()

    # Object Pages
    print("\n========== OBJECT ID COMPARISON ==========\n")
    for i, obj in enumerate(objects, start=1):
        print(f"Object ID: {obj['id']}")
        print(f"Expected crop key: OBJDET_crop_{obj['id']}")
        print(f"Expected plot key: CEX_object_{obj['id']}")
        print(f"Actual crop path: {obj.get('crop_path')}")
        print(f"Actual plot path: {obj.get('plot_path')}\n")

        build_single_object_page(
            c,
            object_name=obj["id"],
            index=i,
            object_type=obj.get("type", "Unknown"),
            description_lines=obj.get("description", []),
            crop_path=obj.get("crop_path"),
            plot_path=obj.get("plot_path"),
            header_img_path=header_img_path,
            footer_img_path=footer_img_path
        )

    c.save()

