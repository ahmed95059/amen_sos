"""
Project: SoulSketch
File: pdf_generator/pages_builders/build_faces_pages.py
Authors: Itay Vazana & Oriya Even Chen

Description:
Generates the full Facial Expressions section in the final PDF report.

Includes:
1. Intro page with title
2. Detection overview page with up to 3 overview images
3. Per-expression pages using build_single_expression_page()

All pages use a consistent header/footer with fallback image support.
"""

import sys
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from pages_builders.single_expression_page_builder import build_single_expression_page

# === Auto-injected project root resolver ===
PROJECT_ROOT = Path(__file__).resolve().parent
while PROJECT_ROOT.name not in ["SoulSketch", "model"]:
    if PROJECT_ROOT.parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = PROJECT_ROOT.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BANNER_HEIGHT = 80
FOOTER_HEIGHT = 80
FALLBACK_IMG = str(PROJECT_ROOT / "assets" / "image_placeholder.png")


def safe_draw_image(c, path, x, y, width, height):
    """
    Attempts to draw an image from path. If path is invalid, draws a fallback image.
    For headers/footers, disables aspect ratio preservation to ensure full-width stretch.
    """
    final_path = path if path and Path(path).exists() else FALLBACK_IMG
    preserve = not any(key in str(final_path).lower() for key in ["banner", "footer"])
    try:
        c.drawImage(ImageReader(final_path), x, y, width=width, height=height, preserveAspectRatio=preserve, mask='auto')
    except Exception as e:
        print(f"[DRAW ERROR] Failed to draw image from {final_path}: {e}")


def build_faces_pages(output_path: str,
                      header_img_path: str,
                      footer_img_path: str,
                      expressions: list[dict],
                      detection_img_paths: list[str]):
    """
    Generates the Facial Expressions section with intro + detection overview + per-expression pages.
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # === Intro Page ===
    safe_draw_image(c, header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT)
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(colors.HexColor("#111111"))
    c.drawCentredString(width / 2, height / 2, "Facial Expressions Analysis")
    safe_draw_image(c, footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT)
    c.showPage()

    # === Detection Overview Page ===
    safe_draw_image(c, header_img_path, 0, height - BANNER_HEIGHT, width=width, height=BANNER_HEIGHT)
    content_top = height - BANNER_HEIGHT
    content_bottom = FOOTER_HEIGHT
    section_height = (content_top - content_bottom) / 3

    for i, img_path in enumerate(detection_img_paths[:3]):
        y = content_bottom + (2 - i) * section_height
        if i == 0:
            safe_draw_image(c, img_path, width / 2 - 150, y + 10,
                            width=300, height=section_height - 20)
        else:
            safe_draw_image(c, img_path, 0, y, width=width, height=section_height)

    safe_draw_image(c, footer_img_path, 0, 0, width=width, height=FOOTER_HEIGHT)
    c.showPage()

    # === Per-Expression Pages ===
    print("========== EXPRESSION ID COMPARISON ==========\n")
    for i, exp in enumerate(expressions, start=1):
        print(f"[BUILD] Expression {exp['id']} — Crop: {exp.get('crop_path')}, Plot: {exp.get('plot_path')}")
        if not exp.get('crop_path'):
            print(f"[WARNING] Missing crop for {exp['id']}")
        if not exp.get('plot_path'):
            print(f"[WARNING] Missing plot for {exp['id']}")

        build_single_expression_page(
            c,
            expression_name=exp["id"],
            index=i,
            expression_type=exp.get("expression", "Unknown"),
            description_lines=exp.get("description", []),
            crop_path=exp.get("crop_path"),
            plot_path=exp.get("plot_path"),
            header_img_path=header_img_path,
            footer_img_path=footer_img_path
        )

    c.save()

